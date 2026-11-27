<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import {
    Pause,
    Play,
    Podcast,
    Repeat,
    Repeat1,
    RotateCcw,
    RotateCw,
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
    PODCAST_SKIP_SECONDS,
    podcastPlayer,
    prevTrack,
    seekTo,
    setVolume,
    skipBy,
    toggleMute,
    togglePlayback,
    toggleShuffle,
  } from "#lib/stores/mediaPlayer.svelte.ts";

  let audioEl: HTMLAudioElement | undefined = $state();

  let current = $derived(currentTrack());
  let visible = $derived(podcastPlayer.queue.length > 0);
  let episodeHref = $derived(
    current ? `/${encodetoNote(current.eventId)}` : "#",
  );
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
  let loopTitle = $derived(`${$_("podcast.loop")}: ${podcastPlayer.loopMode}`);

  let skipBackLabel = $derived(
    $_("podcast.skipBack", { seconds: PODCAST_SKIP_SECONDS }),
  );
  let skipForwardLabel = $derived(
    $_("podcast.skipForward", { seconds: PODCAST_SKIP_SECONDS }),
  );

  // スマホでは音量アイコンをタップするとスライダーをポップアップ表示する
  let volumeOpen = $state(false);

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
        event.target instanceof Element &&
        !event.target.closest("[data-volume-wrapper]")
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

  // ドラッグ中はシークを確定せず、離した時だけ audio.currentTime を更新する。
  // timeupdate による値の上書きでつまみが飛ぶのを防ぐ。
  let scrubTime = $state<number | null>(null);

  // ドラッグ中に回が変わったら（例: 再生終了で次へ進んだ）保留値を破棄する。
  // 前の回の位置で次の回をシークして冒頭が飛ぶのを防ぐ。
  $effect(() => {
    current?.eventId;
    podcastPlayer.currentIndex;
    scrubTime = null;
  });

  function commitSeek() {
    if (scrubTime === null) return;
    const seconds = scrubTime;
    scrubTime = null;
    seekTo(seconds);
  }

  let seekPercent = $derived(
    podcastPlayer.duration > 0
      ? Math.max(
          0,
          Math.min(
            100,
            ((scrubTime ?? podcastPlayer.currentTime) /
              podcastPlayer.duration) *
              100,
          ),
        )
      : 0,
  );
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
  <!-- 情報・進捗・操作を分けた共通パーツ -->
  {#snippet artwork(className: string)}
    <a
      href={showHref}
      class={`shrink-0 ${className}`}
      aria-label={$_("podcast.openShow")}
    >
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
          <MicSignal size={22} />
        </div>
      {/if}
    </a>
  {/snippet}

  {#snippet titleRow(className: string)}
    <div class={`flex min-w-0 items-baseline gap-2 ${className}`}>
      <a
        href={episodeHref}
        class="truncate text-sm font-semibold text-zinc-100 hover:text-magnum-300"
        {title}>{title}</a
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
  {/snippet}

  {#snippet seekRow(className: string)}
    <div
      class={`flex items-center gap-2 text-[11px] text-zinc-400 ${className}`}
    >
      <span class="shrink-0 tabular-nums">
        {formatPlaybackTime(scrubTime ?? podcastPlayer.currentTime)}
      </span>
      <input
        type="range"
        min="0"
        max={podcastPlayer.duration || 0}
        step="1"
        value={scrubTime ?? podcastPlayer.currentTime}
        oninput={(event) => (scrubTime = Number(event.currentTarget.value))}
        onchange={() => commitSeek()}
        onpointerup={() => commitSeek()}
        aria-label={$_("podcast.seek")}
        aria-valuetext={`${formatPlaybackTime(
          scrubTime ?? podcastPlayer.currentTime,
        )} / ${formatPlaybackTime(podcastPlayer.duration)}`}
        class="seek-slider min-w-0 flex-1 cursor-pointer"
        style={`--seek-progress: ${seekPercent}%`}
      />
      <span class="shrink-0 tabular-nums">
        {formatPlaybackTime(podcastPlayer.duration)}
      </span>
    </div>
  {/snippet}

  {#snippet transport(className: string)}
    <div class={className}>
      <button
        type="button"
        onclick={() => prevTrack()}
        aria-label={$_("podcast.previous")}
        title={$_("podcast.previous")}
        class="rounded-full p-1.5 text-zinc-300 hover:bg-zinc-800 active:scale-95"
      >
        <SkipBack size={18} />
      </button>
      <button
        type="button"
        onclick={() => skipBy(-PODCAST_SKIP_SECONDS)}
        aria-label={skipBackLabel}
        title={skipBackLabel}
        class="rounded-full p-2 text-zinc-200 hover:bg-zinc-800 hover:text-magnum-300 active:scale-95"
      >
        <span class="relative inline-flex items-center justify-center">
          <RotateCcw size={20} />
          <span class="absolute text-[8px] font-bold leading-none">
            {PODCAST_SKIP_SECONDS}
          </span>
        </span>
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
        class="rounded-full bg-magnum-600 p-2.5 text-magnum-50 hover:brightness-110 active:scale-95"
      >
        {#if podcastPlayer.isPlaying}
          <Pause size={20} />
        {:else}
          <Play size={20} />
        {/if}
      </button>
      <button
        type="button"
        onclick={() => skipBy(PODCAST_SKIP_SECONDS)}
        aria-label={skipForwardLabel}
        title={skipForwardLabel}
        class="rounded-full p-2 text-zinc-200 hover:bg-zinc-800 hover:text-magnum-300 active:scale-95"
      >
        <span class="relative inline-flex items-center justify-center">
          <RotateCw size={20} />
          <span class="absolute text-[8px] font-bold leading-none">
            {PODCAST_SKIP_SECONDS}
          </span>
        </span>
      </button>
      <button
        type="button"
        onclick={() => nextTrack(false)}
        aria-label={$_("podcast.next")}
        title={$_("podcast.next")}
        class="rounded-full p-1.5 text-zinc-300 hover:bg-zinc-800 active:scale-95"
      >
        <SkipForward size={18} />
      </button>
    </div>
  {/snippet}

  {#snippet secondary(className: string)}
    <div class={className}>
      <button
        type="button"
        onclick={() => cycleLoopMode()}
        aria-label={loopTitle}
        title={loopTitle}
        class={`rounded-full p-1.5 hover:bg-zinc-800 active:scale-95 ${
          podcastPlayer.loopMode === "off" ? "text-zinc-500" : "text-magnum-400"
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
      <div class="relative" data-volume-wrapper>
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
            class="absolute bottom-full right-0 z-[96] mb-2 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-lg sm:hidden"
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={podcastPlayer.volume}
              oninput={(event) => setVolume(Number(event.currentTarget.value))}
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
    </div>
  {/snippet}

  {#snippet closeButton(className: string)}
    <button
      type="button"
      onclick={() => clearQueue()}
      aria-label={$_("podcast.close")}
      title={$_("podcast.close")}
      class={`rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 active:scale-95 ${className}`}
    >
      <X size={18} />
    </button>
  {/snippet}

  <aside
    class="fixed inset-x-0 bottom-14 z-[90] border-t border-magnum-600/50 bg-zinc-900/95 shadow-[0_-4px_20px_rgba(0,0,0,0.35)] backdrop-blur md:bottom-0"
    aria-label={$_("podcast.player")}
  >
    <!-- モバイル: 情報 / 進捗 / 操作の3層 -->
    <div
      class="mx-auto grid max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-2 py-2 sm:hidden"
    >
      {@render artwork("col-start-1 row-span-2 row-start-1 self-center")}
      {@render titleRow("col-start-2 row-start-1")}
      {@render closeButton("col-start-3 row-start-1")}
      {@render seekRow("col-start-2 row-start-2")}
      <div
        class="col-span-3 row-start-3 grid grid-cols-[1fr_auto_1fr] items-center gap-x-1"
      >
        <span aria-hidden="true"></span>
        {@render transport("flex items-center justify-center gap-0.5")}
        <div class="flex justify-end">
          {@render secondary("flex items-center gap-0.5")}
        </div>
      </div>
    </div>

    <!-- デスクトップ: 情報+進捗を左、副操作と主操作を右に2層で配置 -->
    <div
      class="mx-auto hidden max-w-6xl sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-rows-[auto_auto] sm:items-center sm:gap-x-3 sm:gap-y-1 sm:px-4 sm:py-2"
    >
      {@render artwork("col-start-1 row-span-2 row-start-1 self-center")}
      <div
        class="col-start-2 row-span-2 row-start-1 flex min-w-0 flex-col justify-center"
      >
        {@render titleRow("")}
        {@render seekRow("mt-1")}
      </div>
      <div class="col-start-3 row-start-1 flex items-center justify-end gap-1">
        {@render secondary("flex items-center gap-1")}
        <div class="ml-1 border-l border-zinc-700/60 pl-1">
          {@render closeButton("")}
        </div>
      </div>
      <div class="col-start-3 row-start-2 flex items-center justify-end gap-1">
        {@render transport("flex items-center gap-1")}
      </div>
    </div>

    {#if podcastPlayer.error}
      <p class="px-4 pb-1 text-xs text-red-400">{$_("podcast.playError")}</p>
    {/if}
  </aside>
{/if}

<style>
  /* タッチ領域を24pxに広げつつ、見た目のトラックは4pxに保つ */
  .seek-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 24px;
    background: transparent;
  }
  .seek-slider::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 9999px;
    background: linear-gradient(
      to right,
      rgb(var(--color-magnum-500)) var(--seek-progress, 0%),
      rgb(var(--color-zinc-700)) var(--seek-progress, 0%)
    );
  }
  .seek-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    margin-top: -6px;
    border-radius: 9999px;
    background: rgb(var(--color-magnum-50));
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
  }
  .seek-slider::-moz-range-track {
    height: 4px;
    border-radius: 9999px;
    background: rgb(var(--color-zinc-700));
  }
  .seek-slider::-moz-range-progress {
    height: 4px;
    border-radius: 9999px;
    background: rgb(var(--color-magnum-500));
  }
  .seek-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: 0;
    border-radius: 9999px;
    background: rgb(var(--color-magnum-50));
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
  }
  .seek-slider:focus-visible {
    outline: 2px solid rgb(var(--color-magnum-400));
    outline-offset: 2px;
  }
</style>
