<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import type { Profile } from "$lib/types";

  import { Repeat2, TriangleAlert } from "lucide-svelte";
  import Reaction from "./Reaction.svelte";

  import { loginUser, showImg, viewEventIds } from "$lib/stores/stores";

  import { nip19 } from "nostr-tools";
  import Content from "./Content.svelte";
  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined = undefined;
  export let status: string | undefined = undefined;
  export let mini: boolean = false;
  import Avatar from "svelte-boring-avatars";
  import WarningHide1 from "../Elements/WarningHide1.svelte";
  import WarningHide2 from "../Elements/WarningHide2.svelte";
  import { formatAbsoluteDate, splitHexColorString } from "$lib/func/util";
  import UserAvatar from "../Elements/UserAvatar.svelte";
  import Reply from "./Reply.svelte";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import RepostedNote from "./RepostedNote.svelte";
  import { onDestroy, onMount } from "svelte";

  let currentNoteId: string | undefined = undefined;

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

  const profile = (ev: Nostr.Event): Profile | undefined => {
    try {
      return JSON.parse(ev.content);
    } catch (error) {
      return undefined;
    }
  };
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
    const ptag = note.tags.find((tag) => tag[0] === "p");

    return (ptag?.[1] as string) === $loginUser
      ? "border-magnum-600 bg-magnum-700/20"
      : "border-magnum-600";
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
</script>

<div class="rounded-md border overflow-hidden {noteClass()} ">
  {#if note.kind === 1}
    <div class={"grid grid-cols-[auto_1fr]"}>
      <div class="p-1">
        {#if $showImg && metadata && profile(metadata)?.picture !== undefined}
          <UserAvatar
            url={profile(metadata)?.picture}
            pubkey={note.pubkey}
            name={profile(metadata)?.name}
            size={mini ? 20 : 40}
          />
        {:else}
          <Avatar
            size={mini ? 20 : 40}
            name={note.pubkey}
            variant="beam"
            colors={splitHexColorString(note.pubkey)}
          />
        {/if}
      </div>
      <div class="p-1">
        <div class="flex align-middle">
          {#if metadata}
            <div>
              {profile(metadata)?.display_name ?? profile(metadata)?.name}<span
                class="text-magnum-100 text-sm mt-auto mb-auto ml-1 inline-flex"
                >@{profile(metadata)?.name}</span
              >
            </div>
          {:else}
            <span class="text-magnum-100 text-sm mt-auto mb-auto break-all">
              @{nip19.npubEncode(note.pubkey)}</span
            >
          {/if}
          <div
            class="inline-flex ml-auto mr-1 text-magnum-100 text-xs mt-auto mb-auto"
          >
            {formatAbsoluteDate(note.created_at)}
          </div>
        </div>
        <hr />
        {#await replyedEvent(note.tags) then { replyID, replyUsers }}
          {#if replyID || replyUsers.length > 0}<div class="">
              <Reply {replyID} {replyUsers} />
              <hr />
            </div>
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
        <NoteActionButtons {note} {metadata} />
      </div>
    </div>
  {:else if note.kind === 6 || note.kind === 16}
    <!--リポスト-->
    <div class="flex gap-1">
      <Repeat2
        size="20"
        class="min-w-[20px] mt-auto mb-auto stroke-magnum-500"
      />
      <div class="self-center">
        {#if $showImg && metadata && profile(metadata)?.picture !== undefined}
          <UserAvatar
            url={profile(metadata)?.picture}
            name={profile(metadata)?.name}
            pubkey={note.pubkey}
            size={20}
          />
        {:else}
          <Avatar
            size={20}
            name={note.pubkey}
            variant="beam"
            colors={splitHexColorString(note.pubkey)}
          />
        {/if}
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
      <div class="ml-auto mr-2">
        <NoteActionButtons {note} {metadata} />
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
      <div class="w-fit"><Reaction event={note} /></div>
      <div class="self-center">
        {#if $showImg && metadata && profile(metadata)?.picture !== undefined}
          <UserAvatar
            url={profile(metadata)?.picture}
            name={profile(metadata)?.name}
            pubkey={note.pubkey}
            size={20}
          />
        {:else}
          <Avatar
            size={20}
            name={note.pubkey}
            variant="beam"
            colors={splitHexColorString(note.pubkey)}
          />
        {/if}
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
      <div class="ml-auto">
        <NoteActionButtons {note} {metadata} />
      </div>
    </div>

    {#await repostedId(note.tags) then { kind, tag }}
      {#if tag}
        <RepostedNote {tag} {kind} />
      {/if}
    {/await}
  {:else}
    <!--その他-->
    <div class="break-all overflow-x-hidden">
      kind:{note.kind}{#if metadata}
        {profile(metadata)?.name}
      {/if}
    </div>
    <hr />
    {note.tags}
    <hr />
    <Content text={note.content} tags={note.tags} />
    <NoteActionButtons {note} {metadata} />
  {/if}
</div>
