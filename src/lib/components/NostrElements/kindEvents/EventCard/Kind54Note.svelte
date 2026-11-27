<script lang="ts">
  // NIP-F4 Podcasts: kind:54（エピソード）と kind:10154（番組メタデータ）を結合して表示する
  import * as Nostr from "nostr-typedef";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { ExternalLink, MicSignal, Pause, Play } from "@lucide/svelte";

  import Link from "#lib/components/Elements/Link.svelte";
  import ClientTag from "#lib/components/NostrElements/content/ClientTag.svelte";
  import { encodetoNpub } from "#lib/func/encode.ts";
  import { checkContentWarning } from "#lib/func/event.ts";
  import {
    buildPodcastTracks,
    parsePodcastEpisode,
    parsePodcastShow,
    type PodcastTrack,
  } from "#lib/func/podcast.ts";
  import { displayShortPub } from "#lib/func/util.ts";
  import { app } from "#lib/stores/stores.ts";
  import {
    bookmark10003,
    lumiSetting,
  } from "#lib/stores/globalRunes.svelte.ts";
  import {
    playQueue,
    podcastPlayer,
    togglePlayback,
  } from "#lib/stores/mediaPlayer.svelte.ts";
  import { useReplaceableEvent } from "#lib/stores/useReplaceableEvent.ts";

  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import PodcastShowNotes from "./PodcastShowNotes.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: number | undefined;
    repostable: boolean;

    zIndex: number | undefined;
    mini: boolean;
    showStatus?: boolean;
    // 番組ページから渡される全エピソードの再生キュー。
    // タイムライン上では未指定で、そのエピソード単体を再生する。
    podcastQueue?: PodcastTrack[];
  }

  let {
    note,
    metadata,
    displayMenu,
    depth,
    maxHeight,
    repostable,

    zIndex,
    mini,
    showStatus = true,
    podcastQueue,
  }: Props = $props();

  let deleted = $state(false);
  let warning = $derived(checkContentWarning(note?.tags || []));
  let isBookmarked: boolean = $derived(
    bookmark10003
      .get()
      ?.tags.some((tag) => tag[0] === "e" && tag[1] === note.id) ?? false,
  );

  // エピソードの pubkey が番組の公開鍵を兼ねるため、10154 を引いて番組情報を補完する
  let showResult = $derived(
    useReplaceableEvent(
      $app?.rxNostr,
      ["kind10154", note.pubkey],
      note.pubkey,
      10154,
    ),
  );
  let showData = $derived(showResult.data);
  let showPacket = $derived($showData);
  let show = $derived(
    showPacket?.event ? parsePodcastShow(showPacket.event) : undefined,
  );

  let episode = $derived(parsePodcastEpisode(note));
  let singleTrack = $derived(buildPodcastTracks([episode], show));
  // 番組ページのキューにこの回が含まれる場合だけ連続再生に乗せる。
  // ミュートや警告でキューから除外された回は、この回だけを単話再生する。
  let queueFromShow = $derived(
    podcastQueue?.some((track) => track.eventId === note.id)
      ? podcastQueue
      : undefined,
  );
  let queue = $derived(
    queueFromShow && queueFromShow.length > 0 ? queueFromShow : singleTrack,
  );
  let playIndex = $derived(
    Math.max(
      0,
      queue.findIndex((track) => track.eventId === note.id),
    ),
  );
  let hasAudio = $derived(episode.audio.length > 0);
  let isCurrent = $derived(
    podcastPlayer.queue[podcastPlayer.currentIndex]?.eventId === note.id,
  );
  let isPlaying = $derived(isCurrent && podcastPlayer.isPlaying);

  let title = $derived(episode.title || $_("podcast.untitledEpisode"));
  let showTitle = $derived(
    show?.title || displayShortPub(show?.pubkey || note.pubkey),
  );
  let showHref = $derived(
    `/podcast/${encodetoNpub(show?.pubkey || note.pubkey)}`,
  );
  let image = $derived(episode.image || show?.image);
  let websites = $derived([
    ...new Set([...episode.websites, ...(show?.websites || [])]),
  ]);
  // 画像URLが壊れている場合はプレースホルダーに切り替える
  let showImageFailed = $state(false);
  let episodeImageFailed = $state(false);

  function handlePlay() {
    if (!hasAudio) return;
    if (isCurrent) {
      togglePlayback();
      return;
    }
    playQueue(queue, playIndex);
  }
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else}
  {#if isBookmarked}<svg
      class="absolute right-0 -top-0.5 fill-magnum-500/75"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="12"
      viewBox="0 0 16 12"
      fill="none"
    >
      <path
        d="M1 1V11L8 5L15 11V1"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>{/if}
  <NoteComponent
    warningText={warning !== undefined
      ? warning.length > 1
        ? warning[1]
        : ""
      : undefined}
  >
    {#snippet icon()}
      <UserPopupMenu
        pubkey={note?.pubkey || ""}
        {metadata}
        size={mini ? 20 : 40}
        {displayMenu}
        {depth}
      />
    {/snippet}
    {#snippet seenOn()}
      {#if lumiSetting.value.showRelayIcon && displayMenu}
        <SeenonIcons id={note.id} width={mini ? 20 : 40} />{/if}
    {/snippet}
    {#snippet name()}
      <ProfileDisplay
        pubkey={note?.pubkey || ""}
        kind={note.kind}
        {metadata}
        kindInfo={true}
      />
    {/snippet}
    {#snippet time()}
      <DisplayTime {displayMenu} {note} />
    {/snippet}
    {#snippet status()}
      {#if lumiSetting.value.showUserStatus && showStatus}<ShowStatus
          pubkey={note?.pubkey || ""}
        />{/if}
    {/snippet}

    {#snippet content()}
      <div class="rounded-md bg-neutral-800 p-2">
        <a
          href={showHref}
          class="mb-2 flex items-center gap-2 text-sm text-magnum-300 hover:opacity-80"
          title={showTitle}
        >
          {#if show?.image && !showImageFailed && lumiSetting.value.showImg}
            <img
              src={show.image}
              alt=""
              class="h-8 w-8 shrink-0 rounded object-cover"
              onerror={() => (showImageFailed = true)}
            />
          {:else}
            <MicSignal size={18} class="shrink-0" />
          {/if}
          <span class="truncate">{showTitle}</span>
        </a>

        <div class="flex gap-2">
          {#if image && !episodeImageFailed && lumiSetting.value.showImg}
            <img
              src={image}
              alt=""
              class="h-24 w-24 shrink-0 rounded object-cover"
              onerror={() => (episodeImageFailed = true)}
            />
          {/if}
          <div class="min-w-0 flex-1">
            <div class="break-words text-lg font-bold">{title}</div>
            {#if episode.description}
              <p
                class="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-sm text-neutral-300/80"
              >
                {episode.description}
              </p>
            {/if}
            <div class="mt-2 flex flex-wrap items-center gap-2">
              {#if hasAudio}
                <button
                  type="button"
                  onclick={handlePlay}
                  class="inline-flex items-center gap-1 rounded-full bg-magnum-600 px-3 py-1 text-sm font-semibold text-magnum-50 hover:brightness-110 active:scale-95"
                >
                  {#if isPlaying}
                    <Pause size={16} />
                    <span>{$_("podcast.pause")}</span>
                  {:else}
                    <Play size={16} />
                    <!-- 番組ページではキューが渡されるので、この回から連続再生されることが分かる文言にする -->
                    <span
                      >{queueFromShow && queueFromShow.length > 1
                        ? $_("podcast.playFromHere")
                        : $_("podcast.play")}</span
                    >
                  {/if}
                </button>
              {/if}
              {#each websites.slice(0, 3) as website}
                <Link
                  href={website}
                  className="inline-flex items-center gap-1 text-xs text-magnum-300 underline hover:opacity-80"
                >
                  {$_("podcast.openWeb")}
                  <ExternalLink size={12} />
                </Link>
              {/each}
            </div>
          </div>
        </div>
      </div>

      {#if episode.content}
        <PodcastShowNotes
          {note}
          {displayMenu}
          {depth}
          {repostable}
          {maxHeight}
          {zIndex}
          {queue}
          episodeId={note.id}
        />
      {/if}
      <ClientTag tags={note?.tags || []} {depth} />
    {/snippet}

    {#snippet actionButtons()}
      {#if displayMenu}
        <NoteActionButtons
          {note}
          {repostable}
          bind:deleted
          {isBookmarked}
          {zIndex}
        />{/if}
    {/snippet}
  </NoteComponent>
{/if}
