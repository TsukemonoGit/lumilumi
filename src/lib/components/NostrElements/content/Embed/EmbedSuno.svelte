<script lang="ts">
  let { url, onError } = $props();
</script>

<div
  class="relative w-full max-h-64 rounded-lg overflow-hidden border border-magnum-400"
>
  <iframe
    src={url}
    frameborder="0"
    allow="autoplay; encrypted-media; fullscreen"
    allowfullscreen
    loading="lazy"
    onerror={onError}
    class="absolute top-0 left-0 w-full h-full"
    title="Suno Player"
  ></iframe>
</div>
