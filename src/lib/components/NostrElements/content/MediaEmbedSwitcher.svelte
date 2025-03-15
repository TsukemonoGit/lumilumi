<script lang="ts">
  import { isvalidURL, getYoutubeVideoId } from "$lib/func/ogp";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  import EmbedYoutube from "./EmbedYoutube.svelte";
  import EmbedTwitter from "./EmbedTwitter.svelte";
  import OgpLoad from "./OgpLoad.svelte";

  let { url }: { url: string } = $props();

  let loadFailed: boolean = $state(false);
  let hostname: string = $derived(isvalidURL(url) ? new URL(url).hostname : "");
  // YouTubeかどうかとビデオIDを取得
  let isYoutube: boolean = $derived(
    hostname.includes("youtube.com") || hostname === "youtu.be"
  );
  let youtubeVideoId: string | null = $derived(getYoutubeVideoId(url));
  // Twitter/X URLかどうかを判定
  let isTwitter: boolean = $derived(
    hostname.includes("twitter.com") ||
      hostname.includes("x.com") ||
      hostname === "t.co"
  );

  // let twitterPostId:boolean = $derived(getTwitterPostId(url));
  // 表示するメディアの種類を判定
  let showImageOrVideo: boolean = $derived(lumiSetting.get().showImg);
  let showYoutubeEmbed: boolean = $derived(
    showImageOrVideo &&
      lumiSetting.get().embed &&
      isYoutube &&
      youtubeVideoId !== null &&
      !loadFailed
  );

  let twitterUrl: string | null = $derived(normalizeTwitterUrl(url));
  let showTwitterEmbed: boolean = $derived(
    showImageOrVideo &&
      lumiSetting.get().embed &&
      isTwitter &&
      twitterUrl !== null &&
      !loadFailed
  );

  function handleOnError() {
    loadFailed = true;
  }

  function normalizeTwitterUrl(url: string) {
    return url.replace(
      /^(?:https?:\/\/)?(?:x\.com|twitter\.com)\/([^\/]+)\/status\/(\d+)/i,
      "https://twitter.com/$1/status/$2"
    );
  }
</script>

{#if showYoutubeEmbed}
  <!--tube-->
  <EmbedYoutube id={youtubeVideoId || ""} onError={handleOnError} />
{:else if showTwitterEmbed}<!--twitter-->
  <EmbedTwitter url={twitterUrl} originalUrl={url} onError={handleOnError} />
{:else}
  <OgpLoad {url} />
{/if}
