<script lang="ts">
  import type * as Nostr from "nostr-typedef";

  import SimpleMarkdown from "#lib/components/MarkdownItem/SimpleMarkdown.svelte";
  import type { PodcastTrack } from "#lib/func/podcast.ts";
  import {
    currentTrack,
    playQueue,
    seekTo,
  } from "#lib/stores/mediaPlayer.svelte.ts";

  interface Props {
    note: Nostr.Event;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    maxHeight: number | undefined;
    zIndex: number | undefined;
    queue: PodcastTrack[];
    episodeId: string;
  }

  let {
    note,
    displayMenu,
    depth,
    repostable,
    maxHeight,
    zIndex,
    queue,
    episodeId,
  }: Props = $props();

  let container: HTMLDivElement | undefined = $state();

  // タイムスタンプリンクのクリックを拾ってプレイヤーをシークする。
  // リンク自体は markdown-it プラグインが "#podcast-time-<秒>" として生成する。
  $effect(() => {
    const element = container;
    if (!element) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href?.startsWith("#podcast-time-")) return;

      event.preventDefault();
      event.stopPropagation();

      const seconds = Number(href.slice("#podcast-time-".length));
      if (!Number.isFinite(seconds)) return;

      // 既にこのエピソードを再生中ならシークだけ行う
      if (currentTrack()?.eventId === episodeId) {
        seekTo(seconds);
        return;
      }

      const index = queue.findIndex((track) => track.eventId === episodeId);
      if (index >= 0) {
        playQueue(queue, index, seconds);
      }
    };

    element.addEventListener("click", handleClick);
    return () => element.removeEventListener("click", handleClick);
  });
</script>

<div bind:this={container}>
  <SimpleMarkdown
    {note}
    {displayMenu}
    {depth}
    {repostable}
    {maxHeight}
    {zIndex}
    podcastTimestamps
  />
</div>
