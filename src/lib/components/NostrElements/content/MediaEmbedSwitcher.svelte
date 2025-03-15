<script lang="ts">
  import { isvalidURL, getYoutubeVideoId } from "$lib/func/ogp";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  import EmbedYoutube from "./EmbedYoutube.svelte";
  import EmbedTwitter from "./EmbedTwitter.svelte";
  import EmbedSpotify from "./EmbedSpotify.svelte"; // Spotifyコンポーネントをインポート
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

  // Spotify URLかどうかを判定
  let isSpotify: boolean = $derived(
    hostname.includes("spotify.com") || hostname.includes("open.spotify.com")
  );
  let spotifyId: string | null = $derived(getSpotifyId(url));

  // let twitterPostId:boolean = $derived(getTwitterPostId(url));
  // 表示するメディアの種類を判定
  let showImageOrVideo: boolean = $derived(lumiSetting.get().showImg);
  let showYoutubeEmbed: boolean = $derived(
    showImageOrVideo && isYoutube && youtubeVideoId !== null && !loadFailed
  );

  let twitterUrl: string | null = $derived(normalizeTwitterUrl(url));
  let showTwitterEmbed: boolean = $derived(
    showImageOrVideo && isTwitter && twitterUrl !== null && !loadFailed
  );

  let showSpotifyEmbed: boolean = $derived(
    showImageOrVideo && isSpotify && spotifyId !== null && !loadFailed
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

  // Spotifyの埋め込みIDを取得する関数（国際版URLにも対応）
  function getSpotifyId(url: string): string | null {
    if (!isvalidURL(url)) return null;

    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes("spotify.com")) return null;

      // パスからコンテンツ種類とIDを抽出
      const pathParts = urlObj.pathname.split("/").filter(Boolean);

      // 国際版URLの場合（例: /intl-ja/track/123456）
      if (pathParts.length >= 3 && pathParts[0].startsWith("intl-")) {
        const type = pathParts[1]; // track, album, playlist, etc.
        const id = pathParts[2];
        if (
          id &&
          ["track", "album", "playlist", "artist", "show", "episode"].includes(
            type
          )
        ) {
          return `${type}:${id}`;
        }
      }
      // 標準版URL（例: /track/123456）
      else if (pathParts.length >= 2) {
        const type = pathParts[0]; // track, album, playlist, etc.
        const id = pathParts[1];
        if (
          id &&
          ["track", "album", "playlist", "artist", "show", "episode"].includes(
            type
          )
        ) {
          return `${type}:${id}`;
        }
      }
      return null;
    } catch (e) {
      console.error("Spotify URL parsing error:", e);
      return null;
    }
  }
</script>

{#if showYoutubeEmbed && youtubeVideoId}
  <!--tube-->
  <EmbedYoutube id={youtubeVideoId} onError={handleOnError} />
{:else if showTwitterEmbed && twitterUrl}
  <!--twitter-->
  <EmbedTwitter url={twitterUrl} originalUrl={url} onError={handleOnError} />
{:else if showSpotifyEmbed && spotifyId}
  <!--spotify-->
  <EmbedSpotify id={spotifyId} onError={handleOnError} />
{:else}
  <OgpLoad {url} />
{/if}
