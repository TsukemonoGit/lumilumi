<script lang="ts">
  import { isvalidURL, getYoutubeVideoId } from "$lib/func/ogp";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";

  import EmbedYoutube from "./Embed/EmbedYoutube.svelte";
  import EmbedTwitter from "./Embed/EmbedTwitter.svelte";
  import OgpLoad from "./OgpLoad.svelte";
  import EmbedBluesky from "./Embed/EmbedBluesky.svelte";

  let forceExpand: boolean = $state(false);
  let { url, author }: { url: string; author: string } = $props();

  let loadFailed: boolean = $state(false);
  let hostname: string = $derived(isvalidURL(url) ? new URL(url).hostname : "");
  let isYoutube: boolean = $derived(
    hostname.includes("youtube.com") || hostname === "youtu.be"
  );
  let youtubeVideoId: string | null = $derived(getYoutubeVideoId(url));
  let isTwitter: boolean = $derived(
    hostname.includes("twitter.com") ||
      hostname.includes("x.com") ||
      hostname === "t.co"
  );
  let isBluesky: boolean = $derived(
    hostname.includes("bsky.app") || url.startsWith("at://")
  );

  let showImageOrVideo: boolean = $derived.by(() => {
    switch (lumiSetting.get().imageAutoExpand) {
      case "all":
        return true;
      case "following":
        return followList.get().has(author);
      case "manual":
      default:
        return false;
    }
  });

  let twitterUrl: string | null = $derived(normalizeTwitterUrl(url));

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

{#if isYoutube && youtubeVideoId && lumiSetting.get().embed && !loadFailed}
  {#if showImageOrVideo || forceExpand}
    <EmbedYoutube id={youtubeVideoId} onError={handleOnError} />
  {:else}
    <button
      class="rounded-md border font-semibold border-magnum-600 text-magnum-200 p-1 m-1 hover:opacity-75 active:opacity-50"
      onclick={() => (forceExpand = true)}
    >
      Expand Youtube
    </button>
  {/if}
{:else if isTwitter && twitterUrl && lumiSetting.get().embed && !loadFailed}
  {#if showImageOrVideo || forceExpand}
    <EmbedTwitter url={twitterUrl} originalUrl={url} onError={handleOnError} />
  {:else}
    <button
      class="rounded-md border font-semibold border-magnum-600 text-magnum-200 p-1 m-1 hover:opacity-75 active:opacity-50"
      onclick={() => (forceExpand = true)}
    >
      Expand X
    </button>
  {/if}
{:else if isBluesky && lumiSetting.get().embed && !loadFailed}
  {#if showImageOrVideo || forceExpand}
    <EmbedBluesky {url} onError={handleOnError} />
  {:else}
    <button
      class="rounded-md border font-semibold border-magnum-600 text-magnum-200 p-1 m-1 hover:opacity-75 active:opacity-50"
      onclick={() => (forceExpand = true)}
    >
      Expand Bluesky
    </button>
  {/if}
{:else}
  <OgpLoad {url} />
{/if}
