<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { Repeat2 } from "lucide-svelte";
  import Reaction from "./Reaction.svelte";

  import {
    loginUser,
    showImg,
    showUserStatus,
    viewEventIds,
  } from "$lib/stores/stores";

  import { nip19 } from "nostr-tools";
  import Content from "./Content.svelte";

  //import WarningHide1 from "../Elements/WarningHide1.svelte";
  import { nip33Regex, profile } from "$lib/func/util";
  import Reply from "./Reply.svelte";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import RepostedNote from "./RepostedNote.svelte";
  import { onDestroy, onMount } from "svelte";

  import Kind0Note from "./Kind0Note.svelte";
  import ProxyTag from "$lib/components/Elements/ProxyTag.svelte";
  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import Link from "$lib/components/Elements/Link.svelte";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import Kind30030Note from "./Kind30030Note.svelte";
  import Kind42Note from "./Kind42Note.svelte";
  import NoteTemplate from "./NoteTemplate.svelte";
  import Kind9735Note from "./Kind9735Note.svelte";
  import { getRelaysById } from "$lib/func/nostr";
  import ChannelMetadataLayout from "./ChannelMetadataLayout.svelte";
  import { goto } from "$app/navigation";
  import ShowStatus from "./ShowStatus.svelte";
  import ListLinkCard from "./ListLinkCard.svelte";
  import ReplyThread from "./ReplyThread.svelte";
  import { muteCheck } from "$lib/func/muteCheck";
  import { page } from "$app/stores";
  import ReactionWebsite from "./ReactionWebsite.svelte";
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import OGP from "$lib/components/Elements/OGP.svelte";
  import UserProfile from "$lib/components/Elements/UserProfile.svelte";
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";

  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined = undefined;
  export let status: string | undefined = undefined;
  export let mini: boolean = false;
  const bech32Pattern = /<bech32>/;
  let currentNoteId: string | undefined = undefined;
  export let displayMenu: boolean = true;
  export let maxHeight: string = "16rem";
  export let thread: boolean = false;
  export let depth: number = 0;
  export let viewMuteEvent = false;
  export let excludefunc = (event: Nostr.Event) => false;
  $: paramNoteId = $page.params.note
    ? getIDbyParam($page.params.note)
    : undefined;

  function getIDbyParam(str: string) {
    const { type, data } = nip19.decode(str);
    if (type === "note") {
      return data as string;
    } else if (type === "nevent") {
      return data.id;
    } else {
      console.log(data);
    }
  }

  // $: replaceable =
  //   (note.kind >= 30000 && note.kind < 40000) ||
  //   (note.kind >= 10000 && note.kind < 20000);

  $: muteType =
    paramNoteId === note.id || excludefunc(note) ? "null" : muteCheck(note);
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

  const baseClass = " overflow-hidden ";
  const noteClass = () => {
    const ptag = note.tags.filter((tag) => tag[0] === "p");
    const user = ptag.find((tag) => tag[1] === $loginUser);
    // let ret = `${baseClass} ${user ? " bg-magnum-700/20" : "border-magnum-600/30"}`;
    // return depth === 0
    //   ? `border-magnum-600 ${ret}`
    //   : `border-magnum-900 ${ret}`;
    return user ? ` bg-magnum-700/10 ${baseClass}` : `${baseClass}`; //border-l-2 border-magnum-700 //bg-magnum-700/10
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
      replyID: reply
        ? reply[1]
        : root
          ? root[1]
          : IDs.length > 0
            ? IDs[IDs.length - 1][1]
            : undefined,
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
  $: proxy = checkProxy(note.tags);
  $: warning = checkContentWarning(note.tags);
  // const { kind, tag } = repostedId(note.tags);
  let replyID: string | undefined;
  let replyUsers: string[];
  $: if (note && note.kind === 1 && note.tags.length > 0) {
    const res = replyedEvent(note.tags);
    replyID = res.replyID;
    replyUsers = res.replyUsers;
  } else {
    replyID = undefined;
    replyUsers = [];
  }
  const handleClickToChannel = (id: string) => {
    if (!id) {
      return;
    }
    const neventPointer: nip19.EventPointer = {
      id: id,
      relays: getRelaysById(id),
    };
    goto(`/channel/${nip19.neventEncode(neventPointer)}`);
  };
</script>

{#if muteType !== "null" && depth >= 1}
  <button
    class="rounded bg-magnum-700 hover:opacity-75 active:opacity-50 text-magnum-50"
    on:click={() => (viewMuteEvent = !viewMuteEvent)}
  >
    {viewMuteEvent ? "hide" : "view"} Mute:{muteType}
  </button>
{/if}
{#if muteType === "null" || viewMuteEvent}
  {#if thread && replyID}
    <div class="border-b border-magnum-600/30">
      <ReplyThread {replyID} {displayMenu} {depth} />
    </div>
  {/if}

  <div class="{noteClass()} ">
    {#if note.kind === 1}
      <NoteTemplate {note} {metadata} tag={proxy} {mini} {displayMenu} {depth}>
        {#if $showUserStatus}<ShowStatus pubkey={note.pubkey} />{/if}
        <!-- {@const { replyID, replyUsers } = replyedEvent(note.tags)}-->
        {#if !thread && (replyID || replyUsers.length > 0)}
          <Reply {replyID} {replyUsers} {displayMenu} {depth} />
          <!--<hr />-->
        {/if}

        <div class="relative overflow-hidden mb-1.5">
          <div
            class="mt-0.5 overflow-y-auto overflow-x-hidden"
            style="max-height:{maxHeight ?? 'none'}"
          >
            <Content
              text={note.content}
              tags={note.tags}
              {displayMenu}
              {depth}
            />
          </div>
          {#if warning}
            <!-- <WarningHide1 text={tag[1]} /> -->
            <WarningHide2 text={warning[1]} />
          {/if}
        </div>

        {#if proxy}
          <div class="text-end">
            <ProxyTag proxyTag={proxy} />
          </div>
        {/if}
        {#if displayMenu}
          <NoteActionButtons {note} />{/if}
      </NoteTemplate>
    {:else if note.kind === 6 || note.kind === 16}
      <!--リポスト-->
      <div class="flex gap-1 items-center bg-magnum-800/25">
        <span class="text-xs text-magnum-500">{note.kind}</span><Repeat2
          size="20"
          class="min-w-[20px] mt-auto mb-auto stroke-magnum-500"
        />
        <div class="self-center">
          <UserMenu
            pubkey={note.pubkey}
            bind:metadata
            size={20}
            {displayMenu}
            {depth}
          />
        </div>
        <div class=" inline-block break-all break-words whitespace-pre-line">
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
        {#if proxy}
          <div class="text-end">
            <ProxyTag proxyTag={proxy} />
          </div>
        {/if}
        <div class="ml-auto mr-2">
          {#if displayMenu}
            <NoteActionButtons {note} />{/if}
        </div>
      </div>
      <!--リアクションしたノートの情報-->
      {@const { kind, tag } = repostedId(note.tags)}
      {#if tag}
        <RepostedNote {tag} {kind} depth={depth + 1} />
      {/if}
    {:else if note.kind === 7}
      <!--リアクション-->
      <div class="flex gap-1 items-center bg-magnum-800/25">
        <div class="w-fit max-w-[40%]"><Reaction event={note} /></div>
        <div class="self-center">
          <UserMenu
            pubkey={note.pubkey}
            bind:metadata
            size={20}
            {displayMenu}
            {depth}
          />
        </div>
        <div class="break-all break-words whitespace-pre-line">
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
        {#if proxy}
          <div class="text-end">
            <ProxyTag proxyTag={proxy} />
          </div>
        {/if}
        <div class="ml-auto">
          {#if displayMenu}
            <NoteActionButtons {note} />{/if}
        </div>
      </div>
      <!--リアクションしたノートの情報（リポストのを使いまわし）-->
      {@const { kind, tag } = repostedId(note.tags)}
      {#if tag}
        <RepostedNote {tag} {kind} depth={depth + 1} />
      {/if}
    {:else if note.kind === 17}
      <!--https://github.com/nostr-protocol/nips/pull/1381 reactions to a website-->
      <ReactionWebsite {note} {metadata} {displayMenu} {depth} {proxy} />
    {:else if note.kind === 0}
      <!--kind0-->
      <Kind0Note {note} {proxy} {displayMenu} {depth} />
    {:else if note.kind === 40}
      <!--kind40 パブ茶部屋-->
      <LatestEvent
        queryKey={["channel", "kind41", note.id]}
        filters={[
          { kinds: [41], authors: [note.pubkey], limit: 1, "#e": [note.id] },
        ]}
        let:event
      >
        <div slot="loading">
          <ChannelMetadataLayout
            linkButtonTitle={`/channel/${nip19.noteEncode(note.id)}`}
            handleClickToChannel={() => handleClickToChannel(note.id)}
            id={note.id}
            event={note}
          />
        </div>
        <div slot="nodata">
          <ChannelMetadataLayout
            linkButtonTitle={`/channel/${nip19.noteEncode(note.id)}`}
            handleClickToChannel={() => handleClickToChannel(note.id)}
            id={note.id}
            event={note}
          />
        </div>
        <div slot="error">
          <ChannelMetadataLayout
            linkButtonTitle={`/channel/${nip19.noteEncode(note.id)}`}
            handleClickToChannel={() => handleClickToChannel(note.id)}
            id={note.id}
            event={note}
          />
        </div>
        <ChannelMetadataLayout
          linkButtonTitle={`/channel/${nip19.noteEncode(note.id)}`}
          handleClickToChannel={() => handleClickToChannel(note.id)}
          id={note.id}
          {event}
        />
      </LatestEvent>
    {:else if note.kind === 42}
      <!--kind42 パブ茶コメント-->
      <NoteTemplate {note} {metadata} tag={proxy} {mini} {displayMenu} {depth}>
        <Kind42Note {note} {displayMenu} {depth} /></NoteTemplate
      >
    {:else if note.kind === 30000}
      <ListLinkCard event={note} {depth} />
    {:else if note.kind === 30030}
      <!--kind30030-->
      <NoteTemplate {note} {metadata} tag={proxy} {mini} {displayMenu} {depth}>
        <Kind30030Note {note} /></NoteTemplate
      >
    {:else if note.kind === 9735}
      <!--kind9735 zap receipt-->

      <Kind9735Note {note} {depth} {excludefunc} />
    {:else}
      <!-- その他
      {@const clientData = findClientTag(note)}
      {#if !clientData}
     client tagがないやつここ
        <div class="break-all overflow-x-hidden">
          kind:{note.kind}{#if metadata}
            {profile(metadata)?.name}
          {/if}
        </div>
      
        <div
          class="flex flex-wrap overflow-x-hidden break-all max-h-32 overflow-y-auto"
        >
          {#each note.tags as tag}
            {JSON.stringify(tag)}
          {/each}
        </div>

       
        <div
          class="mt-0.5 overflow-y-auto overflow-x-hidden"
          style="max-height:{maxHeight ?? 'none'}"
        >
          <Content text={note.content} tags={note.tags} {displayMenu} {depth} />
        </div>
        {#if displayMenu}<NoteActionButtons {note} />{/if}

        
      {:else}
       client tag あったので 31990 を さがす とこたち
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
          
            <div
              class="flex flex-wrap overflow-x-hidden break-all max-h-32 overflow-y-auto"
            >
              {#each note.tags as tag}
                {JSON.stringify(tag)}
              {/each}
            </div>
           
            <Content
              text={note.content}
              tags={note.tags}
              {displayMenu}
              {depth}
            />
            {#if displayMenu}<NoteActionButtons {note} />{/if}
          </div>
          <div slot="nodata">
            <div class="break-all overflow-x-hidden">
              kind:{note.kind}{#if metadata}
                {profile(metadata)?.name}
              {/if}
            </div>
           
            <div
              class="flex flex-wrap overflow-x-hidden break-all max-h-32 overflow-y-auto"
            >
              {#each note.tags as tag}
                {JSON.stringify(tag)}
              {/each}
            </div>
          
            <Content
              text={note.content}
              tags={note.tags}
              {displayMenu}
              {depth}
            />
            {#if displayMenu}<NoteActionButtons {note} />{/if}
          </div>
          <div slot="error" let:error>
            <div class="break-all overflow-x-hidden">
              kind:{note.kind}{#if metadata}
                {profile(metadata)?.name}
              {/if}
            </div>
           
            <div
              class="flex flex-wrap overflow-x-hidden break-all max-h-32 overflow-y-auto"
            >
              {#each note.tags as tag}
                {JSON.stringify(tag)}
              {/each}
            </div>
            
            <Content
              text={note.content}
              tags={note.tags}
              {displayMenu}
              {depth}
            />
            {#if displayMenu}<NoteActionButtons {note} />{/if}
          </div>
          client tag からURLさがすとこ
          {#await findWebURL(event.tags, clientData) then urls}
            <UserMenu
              pubkey={note.pubkey}
              bind:metadata
              size={20}
              displayMenu={false}
              {depth}
            />kind:{note.kind}
            {#if metadata}
              @{profile(metadata)?.name}
            {/if}
            {#if urls}
              {#each urls as url}
                {#if $showImg}
                  <OGP {url} let:contents>
                    <Link
                      slot="nodata"
                      className="underline text-magnum-300 break-all "
                      href={url}>{url}</Link
                    >
                    {#if contents.title !== "" || contents.image !== "" || contents.description !== ""}OGP表示はTITLE必須にしておくと思ったけどそしたらXのOGPでてこなくなったから
                      <OgpCard {contents} {url} />
                    {:else}
                      <Link
                        className="underline text-magnum-300 break-all"
                        href={url}>{url}</Link
                      >
                    {/if}
                  </OGP>
                {:else}
                  <Link
                    className="underline text-magnum-300 break-all"
                    href={url}>{url}</Link
                  >{/if}
              {/each}
              {#if displayMenu}<NoteActionButtons {note} />{/if}
            {:else}
             client tag から対応したURL見つからなかったところ？
              <div class="break-all overflow-x-hidden">
                kind:{note.kind}{#if metadata}
                  {profile(metadata)?.name}
                {/if}
              </div>
             
              <div
                class="flex flex-wrap overflow-x-hidden break-word max-h-32 overflow-y-auto"
              >
                {#each note.tags as tag}
                  {JSON.stringify(tag)}
                {/each}
              </div>
             
              <Content
                text={note.content}
                tags={note.tags}
                {displayMenu}
                {depth}
              />
              {#if displayMenu}<NoteActionButtons {note} />{/if}
            {/if}
          {/await}
        </LatestEvent>-->
      {@const title = note.tags.find(
        (tag) => tag[0] === "title" && tag.length > 1
      )?.[1]}
      {@const description = note.tags.find(
        (tag) =>
          (tag[0] === "description" || tag[0] === "summary") && tag.length > 1
      )?.[1]}
      {@const image = note.tags.find(
        (tag) => tag[0] === "image" && tag.length > 1
      )?.[1]}
      <div class=" break-all overflow-x-hidden gap-4 p-1">
        <div class="flex gap-1 w-fit">
          {#if metadata}
            <div>
              <UserMenu
                pubkey={note.pubkey}
                bind:metadata
                size={20}
                {displayMenu}
                {depth}
              />
            </div>
            <div class="text-magnum-100 text-sm">
              @{profile(metadata)?.name}
            </div>
            <div class="text-neutral-300/50 text-sm">kind:{note.kind}</div>
          {/if}
        </div>
        <div class="grid grid-cols-[1fr_auto] w-full gap-1">
          <div>
            <div class="text-lg font-bold text-magnum-400">
              {title ?? "notitle"}
            </div>
            {#if description}
              <div class=" text-neutral-300/80">{description}</div>{/if}
          </div>
          {#if image && $showImg}
            <img
              src={image}
              alt=""
              class="max-w-16 object-contain max-h-16"
            />{/if}
        </div>

        <Content text={note.content} tags={note.tags} {displayMenu} {depth} />
        {#if displayMenu}<NoteActionButtons {note} />{/if}
      </div>{/if}
  </div>
{/if}
