<!-- EmbedSuno.svelte -->
<script lang="ts">
  let { url, onError } = $props();

  // エラーハンドリング用
  const handleError = () => {
    console.error("Suno embed failed to load:", url);
    onError?.();
  };
</script>

<div class="suno-embed-container">
  <iframe
    src={url}
    class="w-full h-96 overflow-hidden rounded-lg"
    frameborder="0"
    allow="encrypted-media; fullscreen; autoplay"
    allowfullscreen
    loading="lazy"
    onerror={handleError}
    title="Embedded Suno player"
    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
  ></iframe>
</div>

<style>
  .suno-embed-container {
    width: 100%;
    min-height: 384px; /* h-96相当 */
  }
</style>
