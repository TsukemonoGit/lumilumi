<script lang="ts">
  interface Props {
    id: string;
    start?: number | null;
    onError: () => void;
  }
  let { id, start = null, onError }: Props = $props();

  const src = $derived(
    start && start > 0
      ? `https://www.youtube.com/embed/${id}?start=${start}`
      : `https://www.youtube.com/embed/${id}`,
  );
</script>

<div class="youtube-embed aspect-video w-full max-h-64">
  <iframe
    width="100%"
    height="100%"
    {src}
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
    loading="lazy"
    class="max-h-64"
    onerror={onError}
  ></iframe>
</div>

<style>
  :global(.youtube-embed iframe) {
    pointer-events: none !important;
  }

  :global(.youtube-embed:hover iframe) {
    pointer-events: auto !important;
  }
</style>
