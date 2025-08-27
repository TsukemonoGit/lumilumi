<script lang="ts">
  import OgpLoad from "../OgpLoad.svelte";

  interface Props {
    url: string;
    originalUrl: string;
    onError: () => void;
  }
  const { url, onError, originalUrl }: Props = $props();
  //  $inspect("twitterUrl:", url);
</script>

<blockquote class="twitter-tweet">
  <a data-chrome="noscrollbar noheader transparent" href={url}
    ><OgpLoad {url} /></a
  >
  <script
    async
    src="https://platform.twitter.com/widgets.js"
    charset="utf-8"
  ></script>
</blockquote>

<style>
  :global(.twitter-tweet iframe) {
    pointer-events: none !important;
  }

  :global(.twitter-tweet:hover iframe) {
    pointer-events: auto !important;
  }
</style>
