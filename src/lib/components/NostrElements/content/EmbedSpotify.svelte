<script lang="ts">
  interface Props {
    id: string;
    onError: () => void;
  }
  let { id, onError }: Props = $props();

  // IDからタイプとSpotify IDを分離
  let type: string = $derived(id ? id.split(":")[0] : "");
  let spotifyId: string = $derived(id ? id.split(":")[1] : "");

  // エラーハンドリング
  function handleError() {
    if (onError) onError();
  }

  $inspect("type", type, "spotifyId", spotifyId);
</script>

<div class="spotify-embed-container">
  <iframe
    title="Spotify Embed"
    style="border-radius:12px; overflow:hidden"
    src="https://open.spotify.com/embed/{type}/{spotifyId}"
    width="100%"
    height="152"
    frameBorder="0"
    allowfullscreen={false}
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    loading="lazy"
    onerror={handleError}
  ></iframe>
</div>

<style>
  .spotify-embed-container {
    position: relative;
    width: 100%;
    max-width: 600px;
    margin: 8px 0;
    border-radius: 8px;
    overflow: hidden;
  }

  iframe {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
</style>
