<!-- EmbedSuno.svelte -->
<script lang="ts">
  let { url, onError } = $props();

  // エラーハンドリング用
  const handleError = () => {
    console.error("Suno embed failed to load:", url);
    onError?.();
  };
</script>

<iframe
  src={url}
  class="w-full h-36 overflow-hidden rounded-lg"
  height={144}
  frameborder="0"
  allow="encrypted-media; fullscreen; autoplay"
  allowfullscreen
  loading="lazy"
  onerror={handleError}
  title="Embedded Suno player"
  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
></iframe>
