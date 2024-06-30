<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import type { Profile } from "$lib/types";

  import { Repeat2 } from "lucide-svelte";
  import Reaction from "./Reaction.svelte";

  import { loginUser, showImg, viewEventIds } from "$lib/stores/stores";

  import { nip19 } from "nostr-tools";
  import Content from "./Content.svelte";

  //import WarningHide1 from "../Elements/WarningHide1.svelte";
  import { formatAbsoluteDate, nip33Regex, profile } from "$lib/func/util";
  import Reply from "./Reply.svelte";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import RepostedNote from "./RepostedNote.svelte";
  import { onDestroy } from "svelte";

  import { getRelaysById } from "$lib/func/nostr";
  import Kind0Note from "./Kind0Note.svelte";
  import ProxyTag from "$lib/components/Elements/ProxyTag.svelte";
  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import Link from "$lib/components/Elements/Link.svelte";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import Kind30030Note from "./Kind30030Note.svelte";
  import Kind42Note from "./Kind42Note.svelte";
  import NoteTemplate from "./NoteTemplate.svelte";

  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined = undefined;
  export let status: string | undefined = undefined;
  export let mini: boolean = false;
  const bech32Pattern = /<bech32>/;
  let currentNoteId: string | undefined = undefined;

  // $: replaceable =
  //   (note.kind >= 30000 && note.kind < 40000) ||
  //   (note.kind >= 10000 && note.kind < 20000);

  $: if (note && note.id !== currentNoteId) {
    $viewEventIds = $viewEventIds.filter((item) => item !== currentNoteId);
    if (!$viewEventIds.includes(note.id)) {
      $viewEventIds.push(note.id);
    }
    currentNoteId = note.id;
  }

  onDestroy(() => {
    $viewEventIds = $viewEventIds.filter((item: string) => item !== note.id);
  });

  //eかa
  const repostedId = (
    tags: string[][]
  ): { tag: string[] | undefined; kind: number | undefined } => {
    const kindtag = tags.find((tag) => tag[0] === "k");
    const kind = kindtag ? Number(kindtag[1]) : undefined;
    return {
      tag: tags
        .slice()
        .reverse()
        .find((tag) => tag[0] === "e" || tag[0] === "a"),
      kind: kind,
    };
  };
  const noteClass = () => {
    const ptag = note.tags.filter((tag) => tag[0] === "p");
    const user = ptag.find((tag) => tag[1] === $loginUser);
    return user ? "border-magnum-600 bg-magnum-700/20" : "border-magnum-600";
  };

  const replyedEvent = (
    tags: string[][]
  ): { replyID: string | undefined; replyUsers: string[] } => {
    const users = tags.reduce((acc, [tag, value]) => {
      if (tag === "p") {
        return [...acc, value];
      } else {
        return acc;
      }
    }, []);
    const IDs = tags?.filter((tag) => tag[0] === "e");
    const root = IDs?.find((item) => item.length > 3 && item[3] === "root");
    const reply = IDs?.find((item) => item.length > 3 && item[3] === "reply");
    //  console.log(root?.[1]);
    return {
      replyUsers: users,
      replyID: reply ? reply[1] : root ? root[1] : undefined,
    };
  };

  const checkContentWarning = (tags: string[][]): string[] | undefined => {
    return tags.find((item) => item[0] === "content-warning");
  };

  const checkProxy = (tags: string[][]): string[] | undefined => {
    return tags.find((item) => item[0] === "proxy");
  };

  const findClientTag = (
    note: Nostr.Event
  ):
    | {
        name: string;
        aTag: string;
        filter: Nostr.Filter;
        naddr: string | undefined;
      }
    | undefined => {
    const clientTag = note.tags.find((item) => item[0] === "client");
    if (!clientTag) {
      return undefined;
    }
    const matches = clientTag[2]?.match(nip33Regex);
    if (!matches) {
      return undefined;
    }
    const filter: Nostr.Filter = {
      kinds: [Number(matches[1])],
      authors: [matches[2]],
      "#d": [matches[3]],
      limit: 1,
    };

    const dtag = note.tags.find((tag) => tag[0] === "d");
    const naddrAddress: nip19.AddressPointer = {
      identifier: dtag?.[1] ?? "",
      kind: note.kind,
      pubkey: note.pubkey,
      relays: getRelaysById(note.id),
    };
    try {
      return {
        name: clientTag[1],
        aTag: clientTag[2],
        filter: filter,
        naddr: nip19.naddrEncode(naddrAddress),
      };
    } catch (error) {
      return {
        name: clientTag[1],
        aTag: clientTag[2],
        filter: filter,
        naddr: undefined,
      };
    }
  };

  const findWebURL = (
    tags: string[][],
    clientData: {
      name: string;
      aTag: string;
      filter: Nostr.Filter;
      naddr: string | undefined;
    }
  ): string[] => {
    if (!clientData.naddr) return [];
    const webTag = tags.reduce((acc, [tag, url, nip19]) => {
      if (tag === "web" && nip19 === "naddr") {
        return [...acc, url];
      } else {
        return acc;
      }
    }, []);

    if (webTag.length == 0) {
      return [];
    }
    return webTag.map((item) => {
      return item.replace(bech32Pattern, clientData.naddr ?? "");
    });
  };
</script>

<div class="rounded-md border overflow-hidden {noteClass()} ">
  {#await checkProxy(note.tags) then tag}
    {#if note.kind === 1}
      <NoteTemplate {note} {metadata} {tag}>
        {#await replyedEvent(note.tags) then { replyID, replyUsers }}
          {#if replyID || replyUsers.length > 0}
            <Reply {replyID} {replyUsers} />
            <hr />
          {/if}
        {/await}
        {#await checkContentWarning(note.tags) then tag}
          <div class="relative">
            <div class=" max-h-64 overflow-y-auto">
              <Content text={note.content} tags={note.tags} />
            </div>
            {#if tag}
              <!-- <WarningHide1 text={tag[1]} /> -->
              <WarningHide2 text={tag[1]} />
            {/if}
          </div>
        {/await}
        {#if tag}
          <div class="text-end">
            <ProxyTag proxyTag={tag} />
          </div>
        {/if}

        <NoteActionButtons {note} />
      </NoteTemplate>
    {:else if note.kind === 6 || note.kind === 16}
      <!--リポスト-->
      <div class="flex gap-1">
        <span class="text-xs text-magnum-500">{note.kind}</span><Repeat2
          size="20"
          class="min-w-[20px] mt-auto mb-auto stroke-magnum-500"
        />
        <div class="self-center">
          <UserMenu pubkey={note.pubkey} bind:metadata size={20} />
        </div>
        <div
          class=" mt-auto inline-block break-all break-words whitespace-pre-line"
        >
          {#if metadata}
            {profile(metadata)?.display_name ?? profile(metadata)?.name}<span
              class="text-magnum-100 text-sm">@{profile(metadata)?.name}</span
            >
          {:else}
            <span class="text-magnum-100 text-sm"
              >@{nip19.npubEncode(note.pubkey)}</span
            >
          {/if}
        </div>
        {#if tag}
          <div class="text-end">
            <ProxyTag proxyTag={tag} />
          </div>
        {/if}
        <div class="ml-auto mr-2">
          <NoteActionButtons {note} />
        </div>
      </div>

      {#await repostedId(note.tags) then { kind, tag }}
        {#if tag}
          <RepostedNote {tag} {kind} />
        {/if}
      {/await}
    {:else if note.kind === 7}
      <!--リアクション-->
      <div class="flex gap-1">
        <div class="w-fit max-w-[40%]"><Reaction event={note} /></div>
        <div class="self-center">
          <UserMenu pubkey={note.pubkey} bind:metadata size={20} />
        </div>
        <div class="break-all break-words whitespace-pre-line mt-auto mb-auto">
          {#if metadata}
            {profile(metadata)?.display_name ?? profile(metadata)?.name}<span
              class="text-magnum-100 text-sm mt-auto"
              >@{profile(metadata)?.name}</span
            >
          {:else}
            <span class="text-magnum-100 text-sm"
              >@{nip19.npubEncode(note.pubkey)}</span
            >
          {/if}
        </div>
        {#if tag}
          <div class="text-end">
            <ProxyTag proxyTag={tag} />
          </div>
        {/if}
        <div class="ml-auto">
          <NoteActionButtons {note} />
        </div>
      </div>

      {#await repostedId(note.tags) then { kind, tag }}
        {#if tag}
          <RepostedNote {tag} {kind} />
        {/if}
      {/await}
    {:else if note.kind === 0}
      <!--kind0-->
      <Kind0Note {note} />
    {:else if note.kind === 40}
      <!--kind42 パブ茶部屋-->
    {:else if note.kind === 42}
      <!--kind42 パブ茶コメント-->
      <NoteTemplate {note} {metadata} {tag}>
        <Kind42Note {note} {metadata} /></NoteTemplate
      >
    {:else if note.kind === 30030}
      <!--kind30030-->
      <NoteTemplate {note} {metadata} {tag}>
        <Kind30030Note {note} /></NoteTemplate
      >
    {:else}
      <!--その他-->
      {#await findClientTag(note) then clientData}
        {#if !clientData}
          <div class="break-all overflow-x-hidden">
            kind:{note.kind}{#if metadata}
              {profile(metadata)?.name}
            {/if}
          </div>
          <hr />
          {note.tags}
          <hr />
          <Content text={note.content} tags={note.tags} />
          <NoteActionButtons {note} />
        {:else}
          <!--client tag 31990 を さがす　-->
          <LatestEvent
            filters={[clientData.filter]}
            queryKey={["naddr", clientData.aTag]}
            let:event
          >
            <div slot="loading">
              <div class="break-all overflow-x-hidden">
                kind:{note.kind}{#if metadata}
                  {profile(metadata)?.name}
                {/if}
              </div>
              <hr />
              {note.tags}
              <hr />
              <Content text={note.content} tags={note.tags} />
              <NoteActionButtons {note} />
            </div>
            <div slot="nodata">
              <div class="break-all overflow-x-hidden">
                kind:{note.kind}{#if metadata}
                  {profile(metadata)?.name}
                {/if}
              </div>
              <hr />
              {note.tags}
              <hr />
              <Content text={note.content} tags={note.tags} />
              <NoteActionButtons {note} />
            </div>
            <div slot="error" let:error>
              <div class="break-all overflow-x-hidden">
                kind:{note.kind}{#if metadata}
                  {profile(metadata)?.name}
                {/if}
              </div>
              <hr />
              {note.tags}
              <hr />
              <Content text={note.content} tags={note.tags} />
              <NoteActionButtons {note} />
            </div>

            {#await findWebURL(event.tags, clientData) then urls}
              <UserMenu
                pubkey={note.pubkey}
                bind:metadata
                size={20}
              />kind:{note.kind}
              {#if metadata}
                @{profile(metadata)?.name}
              {/if}
              {#if urls}
                {#each urls as url}
                  <div>
                    <Link
                      className="underline text-magnum-300 break-all"
                      href={url}>{url}</Link
                    >
                  </div>
                {/each}
                <NoteActionButtons {note} />
              {:else}
                <div class="break-all overflow-x-hidden">
                  kind:{note.kind}{#if metadata}
                    {profile(metadata)?.name}
                  {/if}
                </div>
                <hr />
                {note.tags}
                <hr />
                <Content text={note.content} tags={note.tags} />
                <NoteActionButtons {note} />
              {/if}
            {/await}
          </LatestEvent>
        {/if}
      {/await}
    {/if}
  {/await}
</div>
