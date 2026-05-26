<!-- EmbedSuno.svelte -->
<script lang="ts">
  let { url, onError } = $props();

  const ALLOWED_HOSTS = ["suno.com", "suno.ai"];

  let safeUrl = $derived.by(() => {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:") return null;
      if (
        !ALLOWED_HOSTS.some(
          (h) => u.hostname === h || u.hostname.endsWith("." + h),
        )
      ) {
        return null;
      }
      return url;
    } catch {
      return null;
    }
  });

  $effect(() => {
    if (!safeUrl) onError?.();
  });

  const handleError = () => {
    console.error("Suno embed failed to load:", url);
    onError?.();
  };
</script>

{#if safeUrl}
  <iframe
    src={safeUrl}
    class="w-full h-36 overflow-hidden rounded-lg"
    height={144}
    frameborder="0"
    allow="encrypted-media; fullscreen; autoplay"
    loading="lazy"
    onerror={handleError}
    title="Embedded Suno player"
    sandbox="allow-scripts allow-presentation allow-popups"
  ></iframe>
{/if}
