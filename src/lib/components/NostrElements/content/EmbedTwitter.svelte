<script lang="ts">
  import OgpLoad from "./OgpLoad.svelte";

  interface Props {
    url: string;
    originalUrl: string;
    onError: () => void;
  }
  let { url, onError, originalUrl }: Props = $props();
</script>

<blockquote class="twitter-tweet">
  <a
    class="underline text-magnum-300 break-all hover:opacity-80"
    data-chrome="noscrollbar noheader transparent"
    href={url}><OgpLoad url={originalUrl} /></a
  ><script
    async
    src="https://platform.twitter.com/widgets.js"
    charset="utf-8"
  ></script>
</blockquote>
