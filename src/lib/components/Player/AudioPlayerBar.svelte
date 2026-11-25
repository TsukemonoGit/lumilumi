<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import {
    Pause,
    Play,
    Podcast,
    Repeat,
    Repeat1,
    Shuffle,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    X,
  } from "@lucide/svelte";

  import { encodetoNote, encodetoNpub } from "#lib/func/encode.ts";
  import { formatPlaybackTime } from "#lib/func/podcast.ts";
  import { lumiSetting } from "#lib/stores/globalRunes.svelte.ts";
  import {
    attachAudio,
    clearQueue,
    currentTrack,
    cycleLoopMode,
    handleAudioEnded,
    handleAudioError,
    handleAudioLoadedMetadata,
    handleAudioPause,
    handleAudioPlay,
    handleAudioTimeUpdate,
    loadPodcastVolume,
    nextTrack,
    podcastPlayer,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    togglePlayback,
    toggleShuffle,
  } from "#lib/stores/mediaPlayer.svelte.ts";

  let audioEl: HTMLAudioElement | undefined = $state();

  let current = $derived(currentTrack());
  let visible = $derived(podcastPlayer.queue.length > 0);
  let episodeHref = $derived(current ? `/${encodetoNote(current.eventId)}` : "#");
  let showHref = $derived(
    current ? `/podcast/${encodetoNpub(current.showPubkey)}` : "#",
  );
  let title = $derived(current?.title || $_("podcast.untitledEpisode"));
  // 画像URLが壊れている場合に壊れた画像アイコンを出さないためのフラグ
  let imageFailed = $state(false);

  // 曲が切り替わったら画像エラー状態をリセットする
  $effect(() => {
    current?.eventId;
    imageFailed = false;
  });
  let loopTitle = $derived(
    `${$_("podcast.loop")}: ${podcastPlayer.loopMode}`,
  );

  // スマホでは音量アイコンをタップするとスライダーをポップアップ表示する
  let volumeOpen = $state(false);
  let volumeWrapper: HTMLDivElement | undefined = $state();

  // デスクトップではスライダーを常時表示するため、ブレークポイントを監視する
  let isDesktop = $state(false);
  $effect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const update = () => {
      isDesktop = query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  });

  function handleVolumeClick() {
    // デスクトップはスライダーが常時見えているため、アイコンはミュート切替にする
    if (isDesktop) {
      toggleMute();
      return;
    }
    volumeOpen = !volumeOpen;
  }

  // ポップアップの外側を押したら閉じる
  $effect(() => {
    if (!volumeOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (
        volumeWrapper &&
        event.target instanceof Node &&
        !volumeWrapper.contains(event.target)
      ) {
        volumeOpen = false;
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  });

  // 保存済みの音量は localStorage にあるため、マウント後に読み込む
  $effect(() => {
    loadPodcastVolume();
  });

  // audio 要素はキューが空でもマウントしておき、再生開始前に登録を終える
  $effect(() => {
    const element = audioEl;
    if (!element) return;
    attachAudio(element);
    return () => attachAudio(undefined);
  });
</script>

<audio
  bind:this={audioEl}
  class="hidden"
  preload="metadata"
  onplay={() => handleAudioPlay()}
  onpause={() => handleAudioPause()}
  ontimeupdate={(event) =>
    handleAudioTimeUpdate(event.currentTarget.currentTime)}
  onloadedmetadata={(event) =>
    handleAudioLoadedMetadata(event.currentTarget.duration)}
  onended={() => handleAudioEnded()}
  onerror={() => handleAudioError()}
></audio>

{#if visible && current}
  <aside
    class="fixed inset-x-0 bottom-14 z-[90] border-t border-magnum-600/50 bg-zinc-900/95 shadow-[0_-4px_20px_rgba(0,0,0,0.35)] backdrop-blur md:bottom-0"
    aria-label={$_("podcast.player")}
  >
    <div
      class="mx-auto flex max-w-6xl items-center gap-2 px-2 py-2 sm:gap-3 sm:px-4"
    >
      <a href={showHref} class="shrink-0" aria-label={$_("podcast.openShow")}>
        {#if current.showImage && !imageFailed && lumiSetting.value.showImg}
          <img
            src={current.showImage}
            alt=""
            class="h-11 w-11 rounded object-cover sm:h-12 sm:w-12"
            onerror={() => (imageFailed = true)}
          />
        {:else}
          <div
            class="flex h-11 w-11 items-center justify-center rounded bg-zinc-800 text-magnum-400 sm:h-12 sm:w-12"
          >
            <Podcast size={22} />
          </div>
        {/if}
      </a>

      <div class="min-w-0 flex-1">
        <div class="flex items-baseline gap-2">
          <a
            href={episodeHref}
            class="truncate text-sm font-semibold text-zinc-100 hover:text-magnum-300"
            title={title}>{title}</a
          >
          {#if current.showTitle}
            <a
              href={showHref}
              class="hidden truncate text-xs text-magnum-300 hover:opacity-80 sm:block"
              title={current.showTitle}>{current.showTitle}</a
            >
          {/if}
          {#if podcastPlayer.queue.length > 1}
            <span class="shrink-0 text-[11px] tabular-nums text-zinc-500">
              {podcastPlayer.currentIndex + 1}/{podcastPlayer.queue.length}
            </span>
          {/if}
        </div>
        <div class="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
          <span class="tabular-nums"
            >{formatPlaybackTime(podcastPlayer.currentTime)}</span
          >
          <input
            type="range"
            min="0"
            max={podcastPlayer.duration || 0}
            step="1"
            value={podcastPlayer.currentTime}
            oninput={(event) => seekTo(Number(event.currentTarget.value))}
            aria-label={$_("podcast.seek")}
            class="h-1 min-w-0 flex-1 cursor-pointer accent-magnum-500"
          />
          <span class="tabular-nums"
            >{formatPlaybackTime(podcastPlayer.duration)}</span
          >
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <button
          type="button"
          onclick={() => cycleLoopMode()}
          aria-label={loopTitle}
          title={loopTitle}
          class={`rounded-full p-1.5 hover:bg-zinc-800 active:scale-95 ${
            podcastPlayer.loopMode === "off"
              ? "text-zinc-500"
              : "text-magnum-400"
          }`}
        >
          {#if podcastPlayer.loopMode === "one"}
            <Repeat1 size={18} />
          {:else}
            <Repeat size={18} />
          {/if}
        </button>
        <button
          type="button"
          onclick={() => toggleShuffle()}
          aria-label={$_("podcast.shuffle")}
          title={$_("podcast.shuffle")}
          class={`hidden rounded-full p-1.5 hover:bg-zinc-800 active:scale-95 xs:inline-flex ${
            podcastPlayer.shuffle ? "text-magnum-400" : "text-zinc-500"
          }`}
        >
          <Shuffle size={18} />
        </button>
        <div class="relative" bind:this={volumeWrapper}>
          <button
            type="button"
            onclick={() => handleVolumeClick()}
            aria-label={isDesktop
              ? podcastPlayer.muted
                ? $_("podcast.unmute")
                : $_("podcast.mute")
              : $_("podcast.volume")}
            title={isDesktop
              ? podcastPlayer.muted
                ? $_("podcast.unmute")
                : $_("podcast.mute")
              : $_("podcast.volume")}
            aria-expanded={isDesktop ? undefined : volumeOpen}
            class={`rounded-full p-1.5 hover:bg-zinc-800 active:scale-95 ${
              podcastPlayer.muted ? "text-magnum-400" : "text-zinc-500"
            }`}
          >
            {#if podcastPlayer.muted}
              <VolumeX size={18} />
            {:else}
              <Volume2 size={18} />
            {/if}
          </button>
          {#if volumeOpen}
            <div
              class="absolute bottom-full left-1/2 z-[96] mb-2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-lg sm:hidden"
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={podcastPlayer.volume}
                oninput={(event) =>
                  setVolume(Number(event.currentTarget.value))}
                aria-label={$_("podcast.volume")}
                class="h-1 w-28 cursor-pointer accent-magnum-500"
              />
              <button
                type="button"
                onclick={() => toggleMute()}
                aria-label={podcastPlayer.muted
                  ? $_("podcast.unmute")
                  : $_("podcast.mute")}
                title={podcastPlayer.muted
                  ? $_("podcast.unmute")
                  : $_("podcast.mute")}
                class="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 active:scale-95"
              >
                {#if podcastPlayer.muted}
                  <VolumeX size={16} />
                {:else}
                  <Volume2 size={16} />
                {/if}
              </button>
            </div>
          {/if}
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={podcastPlayer.volume}
          oninput={(event) => setVolume(Number(event.currentTarget.value))}
          aria-label={$_("podcast.volume")}
          class="hidden h-1 w-16 cursor-pointer accent-magnum-500 sm:block"
        />
        <button
          type="button"
          onclick={() => prevTrack()}
          aria-label={$_("podcast.previous")}
          title={$_("podcast.previous")}
          class="rounded-full p-1.5 hover:bg-zinc-800 active:scale-95"
        >
          <SkipBack size={18} />
        </button>
        <button
          type="button"
          onclick={() => togglePlayback()}
          aria-label={podcastPlayer.isPlaying
            ? $_("podcast.pause")
            : $_("podcast.play")}
          title={podcastPlayer.isPlaying
            ? $_("podcast.pause")
            : $_("podcast.play")}
          class="rounded-full bg-magnum-600 p-2 text-magnum-50 hover:brightness-110 active:scale-95"
        >
          {#if podcastPlayer.isPlaying}
            <Pause size={18} />
          {:else}
            <Play size={18} />
          {/if}
        </button>
        <button
          type="button"
          onclick={() => nextTrack(false)}
          aria-label={$_("podcast.next")}
          title={$_("podcast.next")}
          class="rounded-full p-1.5 hover:bg-zinc-800 active:scale-95"
        >
          <SkipForward size={18} />
        </button>
        <button
          type="button"
          onclick={() => clearQueue()}
          aria-label={$_("podcast.close")}
          title={$_("podcast.close")}
          class="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 active:scale-95"
        >
          <X size={18} />
        </button>
      </div>
    </div>
    {#if podcastPlayer.error}
      <p class="px-4 pb-1 text-xs text-red-400">{$_("podcast.playError")}</p>
    {/if}
  </aside>
{/if}
