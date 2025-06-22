<script lang="ts">
  let { url, onError } = $props();
</script>

<iframe
  src={url}
  class="w-full h-full overflow-y-hidden"
  frameborder="0"
  allow="encrypted-media; fullscreen"
  allowfullscreen
  loading="lazy"
  onerror={onError}
  title={"Embedded suno player"}
  sandbox="allow-scripts allow-same-origin allow-presentation"
></iframe>
