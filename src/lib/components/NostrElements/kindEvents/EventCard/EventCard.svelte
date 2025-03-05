<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { Repeat2 } from "lucide-svelte";
  import Reaction from "../Reaction.svelte";

  import { loginUser, mutebykinds, mutes } from "$lib/stores/stores";

  import { nip19 } from "nostr-tools";
  import Content from "../../content/Content.svelte";

  //import WarningHide1 from "../Elements/WarningHide1.svelte";
  import { profile } from "$lib/func/util";
  import Reply from "../Reply.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import RepostedNote from "./RepostedNote.svelte";
  import { onDestroy, untrack } from "svelte";

  import Kind0Note from "./Kind0Note.svelte";

  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";

  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import Kind30030Note from "./Kind30030Note.svelte";
  import Kind42Note from "./Kind42Note.svelte";
  import NoteTemplate from "./NoteTemplate.svelte";
  import Kind9735Note from "./Kind9735Note.svelte";
  import { getRelaysById } from "$lib/func/nostr";
  import ChannelMetadataLayout from "../ChannelMetadataLayout.svelte";
  import { goto } from "$app/navigation";
  import ShowStatus from "../Status/ShowStatus.svelte";

  import ReplyThread from "../ReplyThread.svelte";
  import { muteCheck } from "$lib/func/muteCheck";
  import { page } from "$app/state";
  import ReactionWebsite from "../ReactionWebsite.svelte";

  import Kind31990Note from "./Kind31990Note.svelte";

  import {
    get31990Ogp,
    removeFirstMatchingId,
    replyedEvent,
    repostedId,
  } from "$lib/func/event";
  import UserName from "../../user/UserName.svelte";
  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";
  import Kind4Note from "./Kind4Note.svelte";
  import ListLinkCard from "./ListLinkCard.svelte";
  import OtherKindNote from "./OtherKindNote.svelte";

  import DisplayName from "$lib/components/NostrElements/user/DisplayName.svelte";
  import {
    followList,
    lumiSetting,
    timelineFilter,
    viewEventIds,
  } from "$lib/stores/globalRunes.svelte";
  import Kind20Note from "./Kind20Note.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import Kind30315Note from "./Kind30315Note.svelte";
  import {
    isReplaceableKind,
    isParameterizedReplaceableKind,
  } from "nostr-tools/kinds";
  import Kind1068Note from "./Kind1068Note.svelte";
  import Kind40Note from "./Kind40Note.svelte";
  import Kind41Note from "./Kind41Note.svelte";

  let currentNoteTag: string[] | undefined = $state(undefined);

  interface Props {
    note: Nostr.Event;
    metadata?: Nostr.Event | undefined;
    //export let status: string | undefined = undefined;
    mini?: boolean;
    displayMenu?: boolean;
    maxHeight?: number;
    thread?: boolean;
    depth?: number;
    viewMuteEvent?: boolean;
    excludefunc?: any;
    repostable?: boolean;
    tieKey: string | undefined;
    zIndex?: number | undefined;
  }

  let {
    note,
    metadata = $bindable(undefined),
    mini = false,
    displayMenu = true,
    maxHeight,
    thread = false,
    depth = 0,
    viewMuteEvent = $bindable(false),
    excludefunc = (event: Nostr.Event) => false,
    repostable = true,
    tieKey,
    zIndex,
  }: Props = $props();

  let deleted = $state(false);
  let atag: string | undefined = $derived.by(() => {
    if (
      note &&
      (isReplaceableKind(note.kind) ||
        isParameterizedReplaceableKind(note.kind))
    ) {
      //atag　で　りぽすと
      const dtag = note.tags.find((tag) => tag[0] === "d");
      return `${note.kind}:${note.pubkey}:${dtag ? dtag[1] : ""}`;
    } else {
      return undefined;
    }
  });

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

  onDestroy(() => {
    // console.log("destroy mae", viewEventIds.get.length);
    // コンポーネント破棄時に現在のタグを削除
    //console.log("destoroy", $state.snapshot(currentNoteTag));
    if (currentNoteTag) {
      viewEventIds.update((value) => {
        return removeFirstMatchingId(value, currentNoteTag);
      });
    }
  });
  //   //  console.log("destoroy ato", viewEventIds.get.length);
  //   // viewEventIds.get = viewEventIds.get;
  // });

  // $: console.log(viewEventIds.get);
  //eかa

  const baseClass = " overflow-hidden ";
  const noteClass = () => {
    const ptag = note.tags.filter((tag) => tag[0] === "p");
    const user =
      note.pubkey !== $loginUser && ptag.find((tag) => tag[1] === $loginUser);
    // let ret = `${baseClass} ${user ? " bg-magnum-700/20" : "border-magnum-600/30"}`;
    // return depth === 0
    //   ? `border-magnum-600 ${ret}`
    //   : `border-magnum-900 ${ret}`;
    return user ? ` bg-magnum-700/10 ${baseClass}` : `${baseClass}`; //border-l-2 border-magnum-700 //bg-magnum-700/10
  };

  const checkContentWarning = (tags: string[][]): string[] | undefined => {
    return tags.find((item) => item[0] === "content-warning");
  };

  // const { kind, tag } = repostedId(note.tags);
  let replyTag: string[] | undefined = $state.raw();
  let replyUsers: string[] = $state.raw([]);

  let loadThread = $state(false);

  //canvasationcheck
  // $: showCanvasationCheck =
  //   page.url.pathname !== "/"
  //     ? true
  //     : checkCanvasation(note.tags, $timelineFilter.selectCanversation);

  let paramNoteId = $derived(
    page.params.note ? getIDbyParam(page.params.note) : undefined
  );
  let muteType = $derived.by(() => {
    if ($mutes || $mutebykinds || timelineFilter.get()) {
      return !timelineFilter.get().adaptMute
        ? "null"
        : paramNoteId === note.id || excludefunc(note)
          ? "null"
          : $mutes || $mutebykinds
            ? muteCheck(note)
            : "null";
    } else {
      return "null";
    }
  });
  // // 指定したタグが既に存在するか確認するヘルパー関数
  // function tagExists(viewEventIds: string[][], tagType: string, tagId: string) {
  //   return viewEventIds.some(
  //     (item: string[]) => item[0] === tagType && item[1] === tagId
  //   );
  // }

  //フィルター作る方で重複削除してるから自分の分だけ追加・削除する

  //atag
  $effect(() => {
    if (note) {
      untrack(() => {
        //console.log("effectまえ:", viewEventIds.get.length);
        noteIDchange(note);
        //console.log("effectあと:", viewEventIds.get.length);
      });
    }
  });

  function noteIDchange(note: Nostr.Event) {
    if (note.id) {
      if (
        atag &&
        (currentNoteTag === undefined || atag !== currentNoteTag?.[1])
      ) {
        // 現在のタグを削除
        if (currentNoteTag) {
          console.log(viewEventIds.get().length);
          viewEventIds.update((value) => {
            return removeFirstMatchingId(value, currentNoteTag);
          });
          console.log(viewEventIds.get().length);
        }
        // 新しいタグがまだ存在しなければ追加
        //if (!tagExists(viewEventIds.get, "a", atag)) {
        viewEventIds.update((value) => {
          value.push(["a", atag]);
          return value;
        });
        //}
        currentNoteTag = ["a", atag];
        // viewEventIds.get = viewEventIds.get;
      } else if (
        atag === undefined &&
        note &&
        note.id !== "" && // プレビュー画面の無効なIDを除外
        (currentNoteTag === undefined || note.id !== currentNoteTag?.[1])
      ) {
        //etag
        // 現在のタグを削除
        if (currentNoteTag) {
          viewEventIds.update((value) => {
            return removeFirstMatchingId(value, currentNoteTag);
          });
        }
        // 新しいタグがまだ存在しなければ追加
        // if (!tagExists(viewEventIds.get, "e", note.id)) {
        viewEventIds.update((value) => {
          value.push(["e", note.id]);
          //console.log(value);
          return value;
        });
        //}
        currentNoteTag = ["e", note.id];
        //viewEventIds.get = viewEventIds.get;
      }
    }
    if (
      note &&
      (note.kind === 1 ||
        note.kind === 42 ||
        note.kind === 4 ||
        note.kind === 1111) /**comment*/ &&
      note.tags.length > 0
    ) {
      const res = replyedEvent(note.tags, note.kind);
      replyTag = res.replyTag;
      replyUsers = res.replyUsers;
    } else {
      replyTag = undefined;
      replyUsers = [];
    }
  }

  let warning = $derived(checkContentWarning(note.tags)); // string[] | undefined

  let petname = $derived(followList.get().get(note.pubkey));
</script>

<!-- {#if showCanvasationCheck} -->
{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else if note}
  {#if muteType !== "null" && depth >= 1}
    <button
      class="rounded bg-magnum-700 hover:opacity-75 active:opacity-50 text-magnum-50"
      onclick={() => (viewMuteEvent = !viewMuteEvent)}
    >
      {viewMuteEvent ? "hide" : "view"} Mute:{muteType}
    </button>
  {/if}
  {#if muteType === "null" || viewMuteEvent}
    {#if thread && replyTag}
      {#if depth >= 1 && depth % 6 === 0 && !loadThread}
        <button
          class="my-1 flex items-center w-fit px-2 max-w-full rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 overflow-hidden h-fit"
          onclick={() => (loadThread = true)}
        >
          Show more
        </button>
      {:else}
        <!-- <div class="border-b border-magnum-600/30"> -->
        <ReplyThread {replyTag} {displayMenu} {depth} {repostable} {tieKey} />
      {/if}
      <!-- </div> -->
    {/if}

    <article class="{noteClass()} w-full">
      {#if note.kind === 1 || note.kind === 1111}
        <NoteTemplate
          {note}
          {metadata}
          {mini}
          {displayMenu}
          {depth}
          {tieKey}
          kindInfo={note.kind !== 1 ? true : false}
        >
          {#if lumiSetting.get().showUserStatus}<ShowStatus
              pubkey={note.pubkey}
              {tieKey}
            />{/if}
          <!-- {@const { replyID, replyUsers } = replyedEvent(note.tags)}-->
          {#if replyUsers.length > 0}
            <div
              class="my-1 text-sm text-magnum-300 flex break-all flex-wrap overflow-x-hidden gap-x-1 max-h-12 overflow-y-auto"
            >
              <span class="text-sm text-neutral-50">To:</span
              >{#each replyUsers as user}
                {#if !displayMenu}<UserName pubhex={user} />{:else}
                  <PopupUserName pubkey={user} {tieKey} />{/if}
              {/each}
            </div>
          {/if}
          {#if !thread && (replyTag || replyUsers.length > 0)}
            <Reply {replyTag} {displayMenu} {depth} {repostable} {tieKey} />
            <!--<hr />-->
          {/if}

          <div class="relative overflow-hidden mb-1.5">
            <!-- <div
              class="mt-0.5 overflow-y-auto overflow-x-hidden"
              style="max-height:{maxHeight ?? 'none'}"
            > -->
            <Content
              {zIndex}
              {maxHeight}
              text={note.content}
              tags={note.tags}
              {displayMenu}
              {depth}
              {repostable}
              {tieKey}
            />
            <!-- </div> -->
            {#if warning}
              <!-- <WarningHide1 text={tag[1]} /> -->
              <WarningHide2 text={warning[1]} />
            {/if}
          </div>

          {#if displayMenu}
            <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
        </NoteTemplate>
      {:else if note.kind === 42}
        <!--kind42 パブ茶コメント-->

        <NoteTemplate {note} {metadata} {mini} {displayMenu} {depth} {tieKey}>
          <Kind42Note
            {zIndex}
            {tieKey}
            {note}
            {displayMenu}
            {depth}
            {repostable}
            {thread}
          /></NoteTemplate
        >
      {:else if note.kind === 6 || note.kind === 16}
        <!--リポスト-->
        <div class="flex gap-1 items-center bg-magnum-800/25">
          {#if note.kind === 16}<span class="text-xs text-magnum-500"
              >{note.kind}</span
            >{/if}<Repeat2
            size="20"
            class="min-w-[20px] mt-auto mb-auto stroke-magnum-400"
          />
          <div class="self-center">
            <UserPopupMenu
              pubkey={note.pubkey}
              {metadata}
              size={20}
              {displayMenu}
              {depth}
              {tieKey}
            />
          </div>
          <div class=" inline-block break-all break-words whitespace-pre-line">
            {#if petname}<span class="text-magnum-100">📛{petname}</span
              >{:else if metadata}
              {@const prof = profile(metadata)}
              {#if prof}
                <DisplayName
                  height={21}
                  name={prof.display_name ?? ""}
                  tags={metadata.tags}
                />
                {#if prof.name && prof.name !== ""}<span
                    class="text-magnum-100 text-sm"
                    ><DisplayName
                      height={21}
                      name={`@${prof.name}`}
                      tags={metadata.tags}
                    /></span
                  >{/if}{/if}
            {:else}
              <span class="text-magnum-100 text-sm"
                >@{nip19.npubEncode(note.pubkey)}</span
              >
            {/if}
          </div>

          <div class="ml-auto">
            {#if displayMenu}
              <NoteActionButtons
                {note}
                {repostable}
                {tieKey}
                bind:deleted
              />{/if}
          </div>
        </div>
        <!--リアクションしたノートの情報-->
        {@const { kind, tag } = repostedId(note.tags)}
        {#if tag}
          <RepostedNote
            {tag}
            depth={depth + 1}
            {repostable}
            {displayMenu}
            {maxHeight}
            {tieKey}
          />
        {:else}<span class="italic">error</span>
        {/if}
      {:else if note.kind === 7}
        <!--リアクション-->
        <div class="flex gap-1 items-center bg-magnum-800/25">
          <div class="w-fit max-w-[40%]">
            <Reaction event={note} />
          </div>
          <div class="self-center">
            <UserPopupMenu
              pubkey={note.pubkey}
              {metadata}
              size={20}
              {displayMenu}
              {depth}
              {tieKey}
            />
          </div>
          <div class="break-all break-words whitespace-pre-line">
            {#if petname}<span class="text-magnum-100">📛{petname}</span
              >{:else if metadata}
              {@const prof = profile(metadata)}
              {#if prof}
                <DisplayName
                  height={21}
                  name={prof.display_name ?? ""}
                  tags={metadata.tags}
                />
                {#if prof.name && prof.name !== ""}<span
                    class="text-magnum-100 text-sm mt-auto"
                    ><DisplayName
                      height={21}
                      name={`@${prof.name}`}
                      tags={metadata.tags}
                    /></span
                  >{/if}{/if}
            {:else}
              <span class="text-magnum-100 text-sm"
                >@{nip19.npubEncode(note.pubkey)}</span
              >
            {/if}
          </div>

          <div class="ml-auto">
            {#if displayMenu}
              <NoteActionButtons
                {note}
                {repostable}
                {tieKey}
                bind:deleted
              />{/if}
          </div>
        </div>
        <!--リアクションしたノートの情報（リポストのを使いまわし）-->
        {@const { kind, tag } = repostedId(note.tags)}
        <!--会話へのリアクションでPに自分が入ってるけどリアクション先は自分のポストじゃないやつある　nevent1qvzqqqqqqupzpujqe8p9zrpuv0f4ykk3rmgnqa6p6r0lan0t8ewd0ksj89kqcz5xqyxhwumn8ghj77tpvf6jumt9qyghwumn8ghj7u3wddhk56tjvyhxjmcpypmhxue69uhhyetvv9uj66ns9ehx7um5wgh8w6tjv4jxuet59e48qqpqs88y4gkru95k9neks03d8u58w2d4nq8lvpn9qrjeuxv2fehg05hqj2xgas-->
        {#if tag}
          <RepostedNote
            {tag}
            depth={depth + 1}
            {repostable}
            {displayMenu}
            {maxHeight}
            {tieKey}
          />
        {:else}<span class="italic">error</span>
        {/if}
      {:else if note.kind === 17}
        <!--https://github.com/nostr-protocol/nips/pull/1381 reactions to a website-->
        <ReactionWebsite {note} {metadata} {displayMenu} {depth} {tieKey} />
      {:else if note.kind === 0}
        <!--kind0-->
        <Kind0Note {note} {displayMenu} {depth} {repostable} {tieKey} />
      {:else if note.kind === 20}
        <Kind20Note
          {tieKey}
          {replyUsers}
          {mini}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {repostable}
          {maxHeight}
          {warning}
        />
      {:else if note.kind === 40}
        <!--kind40 パブ茶部屋-->
        <Kind40Note {tieKey} {note} />
      {:else if note.kind === 41}
        <!--kind:40チャンネルroot-->
        <Kind41Note
          {tieKey}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {repostable}
          {maxHeight}
          {replyUsers}
        />
      {:else if note.kind === 1068}
        <Kind1068Note
          {tieKey}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {repostable}
          {mini}
          {warning}
        />
      {:else if note.kind === 30000}
        <ListLinkCard event={note} {depth} {tieKey} />
      {:else if note.kind === 30030}
        <!--kind30030-->
        <NoteTemplate {note} {metadata} {mini} {displayMenu} {depth} {tieKey}>
          <Kind30030Note
            {note}
            {repostable}
            {maxHeight}
            {tieKey}
          /></NoteTemplate
        >
      {:else if note.kind === 9735}
        <!--kind9735 zap receipt-->

        <Kind9735Note
          {note}
          {depth}
          {excludefunc}
          {repostable}
          {maxHeight}
          {displayMenu}
          {tieKey}
          {mini}
        />
      {:else if note.kind === 4}
        <!--旧仕様のDMだよ-->
        <Kind4Note
          {tieKey}
          {mini}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {maxHeight}
          {warning}
          {replyUsers}
          {thread}
          {replyTag}
        />
      {:else if note.kind === 31990}
        {@const data = get31990Ogp(note)}
        {#if !data}
          <OtherKindNote
            {tieKey}
            {note}
            {metadata}
            {displayMenu}
            {depth}
            {repostable}
            {maxHeight}
            {zIndex}
          />
        {:else}
          <Kind31990Note
            {note}
            {data}
            {metadata}
            {displayMenu}
            {depth}
            {repostable}
            {tieKey}
          />
        {/if}
      {:else if note.kind === 1059}
        <!---->
        Gift Wrap
      {:else if note.kind === 30315}
        <!---->
        <Kind30315Note
          {tieKey}
          {mini}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {maxHeight}
          {warning}
          {repostable}
        />
      {:else}
        <OtherKindNote
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {repostable}
          {maxHeight}
          {tieKey}
          {zIndex}
        />{/if}
    </article>
  {/if}
{/if}
<!-- {/if} -->
<!-- <style>
  article {
    content-visibility: auto;
    contain-intrinsic-size: auto 100px;
  }
</style> -->
