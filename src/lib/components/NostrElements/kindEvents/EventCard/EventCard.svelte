<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { EyeOff, Repeat2 } from "lucide-svelte";
  import { onDestroy, untrack } from "svelte";
  import * as nip19 from "nostr-tools/nip19";
  import { isReplaceableKind, isAddressableKind } from "nostr-tools/kinds";
  import { page } from "$app/state";

  // Store imports
  import { mutebykinds, mutes } from "$lib/stores/stores";
  import {
    loginUser,
    lumiSetting,
    timelineFilter,
    viewEventIds,
  } from "$lib/stores/globalRunes.svelte";

  // Utility function imports
  import { muteCheck } from "$lib/func/muteCheck";
  import {
    get31990Ogp,
    removeFirstMatchingId,
    replyedEvent,
    repostedId,
  } from "$lib/func/event";

  // Component imports
  import Reaction from "../Reaction.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import RepostedNote from "./RepostedNote.svelte";
  import Kind0Note from "./Kind0Note.svelte";
  import Kind1Note from "./Kind1Note.svelte";
  import Kind4Note from "./Kind4Note.svelte";
  import Kind20Note from "./Kind20Note.svelte";
  import Kind30023Note from "./Kind30023Note.svelte";
  import Kind30030Note from "./Kind30030Note.svelte";
  import Kind30315Note from "./Kind30315Note.svelte";
  import Kind31990Note from "./Kind31990Note.svelte";
  import Kind40Note from "./Kind40Note.svelte";
  import Kind41Note from "./Kind41Note.svelte";
  import Kind42Note from "./Kind42Note.svelte";
  import Kind1068Note from "./Kind1068Note.svelte";
  import Kind9735Note from "./Kind9735Note.svelte";
  import OtherKindNote from "./OtherKindNote.svelte";
  import ListLinkCard from "./ListLinkCard.svelte";
  import ReplyThread from "../ReplyThread.svelte";
  import ReactionWebsite from "../ReactionWebsite.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import RepostComponent from "../layout/RepostComponent.svelte";
  import Kind8Note from "./Kind8Note.svelte";
  import Kind30009Note from "./Kind30009Note.svelte";
  import Kind1018Note from "./Kind1018Note.svelte";
  import Kind39701Note from "./Kind39701Note.svelte";
  import Kind9802Note from "./Kind9802Note.svelte";
  import { getIDbyParam } from "$lib/func/util";

  // Component props interface
  interface Props {
    note: Nostr.Event;
    metadata?: Nostr.Event | undefined;
    mini?: boolean;
    displayMenu?: boolean;
    maxHeight?: number;
    thread?: boolean;
    depth?: number;
    viewMuteEvent?: boolean;
    excludefunc?: (event: Nostr.Event) => boolean;
    repostable?: boolean;

    zIndex?: number | undefined;
    showStatus?: boolean;
  }

  // Props with defaults
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

    zIndex,
    showStatus = true,
  }: Props = $props();

  // State variables
  let currentNoteTag: string[] | undefined = $state(undefined);
  let deleted = $state(false);
  let loadThread = $state(false);

  // Process reply tags
  let { replyTag, replyUsers } = $derived.by(() => {
    if (note && [1, 42, 4, 1111].includes(note.kind) && note.tags.length > 0) {
      const res = replyedEvent(note.tags, note.kind);

      return { replyTag: res.replyTag, replyUsers: res.replyUsers };
    }
    return { replyTag: undefined, replyUsers: [] };
  });
  // Derived state
  let atag: string | undefined = $derived.by(() => {
    if (
      !note ||
      (!isReplaceableKind(note.kind) && !isAddressableKind(note.kind))
    ) {
      return undefined;
    }

    const dtag = note.tags.find((tag) => tag[0] === "d");
    return `${note.kind}:${note.pubkey}:${dtag ? dtag[1] : ""}`;
  });

  let paramNoteId = $derived(
    page.params.note ? getIDbyParam(page.params.note) : undefined
  );

  //ミュートメニューの設定は考慮しない
  let muteType = $derived.by(() => {
    if (!$mutes && !$mutebykinds && !timelineFilter.get()) {
      return "null";
    }
    if (paramNoteId === note.id || excludefunc(note)) {
      return "null";
    }

    return muteCheck(note);
  });

  let warning = $derived(checkContentWarning(note?.tags));

  function checkContentWarning(tags: string[][]): string[] | undefined {
    return tags.find((item) => item[0] === "content-warning");
  }

  function noteIDchange(note: Nostr.Event) {
    if (!note.id) return;

    if (
      atag &&
      (currentNoteTag === undefined || atag !== currentNoteTag?.[1])
    ) {
      // Remove current tag if exists
      if (currentNoteTag) {
        viewEventIds.update((value) =>
          removeFirstMatchingId(value, currentNoteTag)
        );
      }

      // Add new tag
      viewEventIds.update((value) => {
        value.push(["a", atag]);
        return value;
      });

      currentNoteTag = ["a", atag];
    } else if (
      atag === undefined &&
      note &&
      note.id !== "" &&
      (currentNoteTag === undefined || note.id !== currentNoteTag?.[1])
    ) {
      // Remove current tag if exists
      if (currentNoteTag) {
        viewEventIds.update((value) =>
          removeFirstMatchingId(value, currentNoteTag)
        );
      }

      // Add new tag
      viewEventIds.update((value) => {
        value.push(["e", note.id]);
        return value;
      });

      currentNoteTag = ["e", note.id];
    }
  }

  // CSS classes
  const baseClass = " overflow-hidden ";
  const noteClass = () => {
    const ptag = note.tags.filter((tag) => tag[0] === "p");
    const user =
      note.pubkey !== lumiSetting.get().pubkey &&
      ptag.find((tag) => tag[1] === lumiSetting.get().pubkey);

    return user ? ` bg-magnum-700/10 ${baseClass}` : `${baseClass}`;
  };

  // Lifecycle hooks
  $effect(() => {
    if (note) {
      untrack(() => noteIDchange(note));
    }
  });

  onDestroy(() => {
    if (currentNoteTag) {
      viewEventIds.update((value) =>
        removeFirstMatchingId(value, currentNoteTag)
      );
    }
  });
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else if note}
  {#if note.pubkey !== loginUser.value && timelineFilter.get().adaptMute && muteType !== "null" && depth >= 1}
    <button
      class="rounded bg-magnum-700 hover:opacity-75 active:opacity-50 text-magnum-50"
      onclick={() => (viewMuteEvent = !viewMuteEvent)}
    >
      {viewMuteEvent ? "hide" : "view"} Mute:{muteType}
    </button>
  {/if}
  {#if !timelineFilter.get().adaptMute || note.pubkey === loginUser.value || muteType === "null" || viewMuteEvent}
    {#if thread && replyTag}
      {#if depth >= 1 && depth % 6 === 0 && !loadThread}
        <button
          class="my-1 flex items-center w-fit px-2 max-w-full rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 overflow-hidden h-fit"
          onclick={() => (loadThread = true)}
        >
          Show more
        </button>
      {:else}
        <ReplyThread {replyTag} {displayMenu} {depth} {repostable} />
      {/if}
    {/if}

    <article class="{noteClass()} w-full">
      <!-- ミュート投稿のアイコン表示 -->
      {#if muteType !== "null"}
        <div
          class="absolute top-0 left-0 bg-neutral-500/80 rounded-full p-1 text-magnum-700 dark:text-magnum-300"
          style={`z-index:${zIndex || 10 + 1}`}
        >
          <EyeOff size={14} />
        </div>
      {/if}
      {#if note.kind === 1 || note.kind === 1111}
        <Kind1Note
          {replyUsers}
          {repostable}
          {zIndex}
          {maxHeight}
          {note}
          {metadata}
          {mini}
          {displayMenu}
          {depth}
          bind:deleted
          {replyTag}
          {thread}
          {showStatus}
          kindInfo={note.kind !== 1 ? true : false}
        />
      {:else if note.kind === 42}
        <!--kind42 パブ茶コメント-->
        <Kind42Note
          {zIndex}
          {metadata}
          {mini}
          {note}
          {displayMenu}
          {depth}
          {repostable}
          {thread}
          {replyTag}
          {replyUsers}
          {showStatus}
        />
      {:else if note.kind === 6 || note.kind === 16}
        <!--リポスト-->
        <RepostComponent>
          {#snippet kindIcon()}
            {#if note.kind === 16}<span class="text-xs text-magnum-500"
                >{note.kind}</span
              >{/if}<Repeat2
              size="20"
              class="min-w-[20px] mt-auto mb-auto stroke-magnum-400"
            />
          {/snippet}
          {#snippet userIcon()}
            <UserPopupMenu
              pubkey={note.pubkey}
              {metadata}
              size={20}
              {displayMenu}
              {depth}
            />
          {/snippet}
          {#snippet name()}
            <ProfileDisplay pubkey={note.pubkey} {metadata} />
          {/snippet}

          {#snippet actionButtons()}
            {#if displayMenu}
              <NoteActionButtons
                {note}
                {repostable}
                bind:deleted
                {zIndex}
              />{/if}
          {/snippet}
        </RepostComponent>

        <!--リアクションしたノートの情報-->
        {@const { kind, tag } = repostedId(note.tags)}
        {#if tag}
          <RepostedNote
            {tag}
            depth={depth + 1}
            {repostable}
            {displayMenu}
            {maxHeight}
            {zIndex}
            {mini}
          />
        {:else}<span class="italic">error</span>
        {/if}
      {:else if note.kind === 7}
        <!--リアクション-->
        <RepostComponent>
          {#snippet kindIcon()}
            <div class="w-fit min-w-[20px] max-w-[40%]">
              <Reaction event={note} />
            </div>
          {/snippet}
          {#snippet userIcon()}
            <UserPopupMenu
              pubkey={note.pubkey}
              {metadata}
              size={20}
              {displayMenu}
              {depth}
            />
          {/snippet}
          {#snippet name()}
            <ProfileDisplay pubkey={note.pubkey} {metadata} />
          {/snippet}

          {#snippet actionButtons()}
            {#if displayMenu}
              <NoteActionButtons
                {note}
                {repostable}
                bind:deleted
                {zIndex}
              />{/if}
          {/snippet}
        </RepostComponent>

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
            {zIndex}
            {mini}
          />
        {:else}<span class="italic">error</span>
        {/if}
      {:else if note.kind === 17}
        <!--https://github.com/nostr-protocol/nips/pull/1381 reactions to a website-->
        <ReactionWebsite {note} {metadata} {displayMenu} {depth} {repostable} />
      {:else if note.kind === 0}
        <!--kind0-->
        <Kind0Note {note} {displayMenu} {depth} {repostable} />
      {:else if note.kind === 20}
        <Kind20Note
          {zIndex}
          {replyUsers}
          {mini}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {repostable}
          {maxHeight}
          {warning}
          {showStatus}
        />
      {:else if note.kind === 40}
        <!--kind40 パブ茶部屋-->
        <Kind40Note {note} />
      {:else if note.kind === 41}
        <!--kind:40チャンネルroot-->
        <Kind41Note
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {repostable}
          {maxHeight}
          {replyUsers}
          {zIndex}
          {mini}
        />
      {:else if note.kind === 1018}
        <Kind1018Note
          {zIndex}
          {replyUsers}
          {mini}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {repostable}
          {maxHeight}
          {warning}
          {showStatus}
        />
      {:else if note.kind === 1068}
        <!--poll-->
        <Kind1068Note
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {repostable}
          {mini}
          {warning}
          {zIndex}
          {maxHeight}
          {showStatus}
        />
      {:else if note.kind === 30000}
        <ListLinkCard event={note} {depth} />
      {:else if note.kind === 30030}
        <!--kind30030-->
        <Kind30030Note
          {note}
          {mini}
          {repostable}
          {maxHeight}
          {displayMenu}
          {metadata}
          {depth}
          {showStatus}
        />
      {:else if note.kind === 9735}
        <!--kind9735 zap receipt-->
        <Kind9735Note
          {note}
          {depth}
          {excludefunc}
          {repostable}
          {maxHeight}
          {displayMenu}
          {mini}
          {zIndex}
        />
      {:else if note.kind === 9802}
        <!--kind9735 zap receipt-->
        <Kind9802Note
          {replyUsers}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {repostable}
          {mini}
          {warning}
          {zIndex}
          {maxHeight}
          {showStatus}
        />
      {:else if note.kind === 4}
        <!--旧仕様のDMだよ-->
        <Kind4Note
          bind:deleted
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
          {repostable}
          {zIndex}
          {showStatus}
        />
      {:else if note.kind === 31990}
        {@const data = get31990Ogp(note)}
        {#if !data}
          <OtherKindNote
            {mini}
            {note}
            {metadata}
            {displayMenu}
            {depth}
            {repostable}
            {maxHeight}
            {zIndex}
            {showStatus}
          />
        {:else}
          <Kind31990Note
            {note}
            {data}
            {metadata}
            {displayMenu}
            {depth}
            {repostable}
            {showStatus}
          />
        {/if}
      {:else if note.kind === 1059}
        <!---->
        Gift Wrap
      {:else if note.kind === 30315}
        <!---->
        <Kind30315Note
          {mini}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {maxHeight}
          {warning}
          {repostable}
          {showStatus}
        />
      {:else if note.kind === 30023 || note.kind === 30024}
        <Kind30023Note
          {mini}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {maxHeight}
          {repostable}
          {zIndex}
          {showStatus}
        />
      {:else if note.kind === 8}
        <!--badge award-->
        <Kind8Note
          bind:deleted
          {mini}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {maxHeight}
          {warning}
          {repostable}
          {zIndex}
          {showStatus}
        />
      {:else if note.kind === 30009}
        <!--badge-->
        <Kind30009Note
          bind:deleted
          {mini}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {maxHeight}
          {warning}
          {repostable}
          {zIndex}
          {showStatus}
        />
      {:else if note.kind === 39701}
        <!--web bookmark-->
        <Kind39701Note
          bind:deleted
          {mini}
          {note}
          {metadata}
          {displayMenu}
          {depth}
          {maxHeight}
          {warning}
          {repostable}
          {zIndex}
          {showStatus}
        />
      {:else}
        <OtherKindNote
          {note}
          {mini}
          {metadata}
          {displayMenu}
          {depth}
          {repostable}
          {maxHeight}
          {zIndex}
          {showStatus}
        />{/if}
    </article>
  {/if}
{/if}

<!-- <style>
  article {
    content-visibility: auto;
    contain-intrinsic-size: auto 100px;
  }
</style> -->
