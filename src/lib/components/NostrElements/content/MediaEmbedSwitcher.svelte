<script lang="ts">
  import { isvalidURL, getYoutubeVideoId } from "$lib/func/ogp";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import EmbedYoutube from "./Embed/EmbedYoutube.svelte";
  import EmbedTwitter from "./Embed/EmbedTwitter.svelte";
  import EmbedBluesky from "./Embed/EmbedBluesky.svelte";
  import OgpLoad from "./OgpLoad.svelte";

  // Types
  type PlatformType = "youtube" | "twitter" | "bluesky" | "other";

  interface URLPattern {
    domains: readonly string[];
    validPaths: readonly RegExp[];
    invalidPaths: readonly RegExp[];
    resourcePatterns?: readonly RegExp[];
  }

  // Props
  let { url, author }: { url: string; author: string } = $props();

  // State
  let forceExpand = $state(false);
  let loadFailed = $state(false);

  // Constants
  const URL_PATTERNS: Record<Exclude<PlatformType, "other">, URLPattern> = {
    youtube: {
      domains: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
      validPaths: [
        /^\/watch$/,
        /^\/embed\/[\w-]+$/,
        /^\/v\/[\w-]+$/,
        /^\/shorts\/[\w-]+$/,
      ],
      invalidPaths: [
        /^\/(?:channel|user|c|results|playlist|feed|account|upload|studio|trending|gaming|music|premium|about|creators)\//,
        /^\/$/,
      ],
    },
    twitter: {
      domains: [
        "twitter.com",
        "www.twitter.com",
        "mobile.twitter.com",
        "x.com",
        "www.x.com",
        "t.co",
      ],
      validPaths: [/^\/[\w]+\/status\/\d+/, /^\/i\/web\/status\/\d+/],
      invalidPaths: [
        /^\/(?:search|explore|notifications|messages|bookmarks|lists|moments|settings|help|privacy|tos|login|signup|home|compose|i\/flow|account|oauth)\//,
        /^\/$/,
      ],
    },
    bluesky: {
      domains: ["bsky.app", "www.bsky.app"],
      validPaths: [/^\/profile\/[^\/]+\/post\/[^\/]+$/],
      invalidPaths: [
        /^\/profile\/[^\/]+\/(?:feed|followers|follows|lists)\//,
        /^\/(?:search|notifications|messages|settings|moderation|feeds|lists|intent|support)\//,
        /^\/$/,
      ],
      resourcePatterns: [
        /\/(?:img|feed_fullsize|avatar|banner)\//,
        /\.(?:jpe?g|png|gif|webp)$/i,
      ],
    },
  };

  const PLATFORM_LABELS = {
    youtube: "Youtube",
    twitter: "X",
    bluesky: "Bluesky",
  } as const;

  // Utility functions
  const parseURL = (url: string): URL | null => {
    try {
      return isvalidURL(url) ? new URL(url) : null;
    } catch {
      return null;
    }
  };

  const matchesDomain = (
    hostname: string,
    domains: readonly string[]
  ): boolean => domains.some((domain) => hostname.toLowerCase() === domain);

  const matchesPatterns = (
    target: string,
    patterns: readonly RegExp[]
  ): boolean => patterns.some((pattern) => pattern.test(target));

  // Platform validation functions
  const isYouTubeValid = (parsedUrl: URL): boolean => {
    const { hostname, pathname, searchParams } = parsedUrl;
    const pattern = URL_PATTERNS.youtube;

    if (!matchesDomain(hostname, pattern.domains)) return false;

    if (hostname === "youtu.be") {
      return /^\/[\w-]+$/.test(pathname) && pathname.length > 1;
    }

    if (matchesPatterns(pathname, pattern.invalidPaths)) return false;

    if (pathname === "/watch") {
      return searchParams.has("v") && !!searchParams.get("v");
    }

    return matchesPatterns(pathname, pattern.validPaths);
  };

  const isTwitterValid = (parsedUrl: URL): boolean => {
    const { hostname, pathname } = parsedUrl;
    const pattern = URL_PATTERNS.twitter;

    if (!matchesDomain(hostname, pattern.domains)) return false;
    if (hostname === "t.co") return true;
    if (matchesPatterns(pathname, pattern.invalidPaths)) return false;

    return matchesPatterns(pathname, pattern.validPaths);
  };

  const isBlueskyValid = (parsedUrl: URL, fullUrl: string): boolean => {
    const { hostname, pathname } = parsedUrl;
    const pattern = URL_PATTERNS.bluesky;

    if (!matchesDomain(hostname, pattern.domains)) return false;
    if (
      pattern.resourcePatterns &&
      matchesPatterns(fullUrl, pattern.resourcePatterns)
    )
      return false;
    if (matchesPatterns(pathname, pattern.invalidPaths)) return false;

    return matchesPatterns(pathname, pattern.validPaths);
  };

  const detectPlatform = (url: string): PlatformType => {
    const parsedUrl = parseURL(url);
    if (!parsedUrl) return "other";

    if (isYouTubeValid(parsedUrl)) return "youtube";
    if (isTwitterValid(parsedUrl)) return "twitter";
    if (isBlueskyValid(parsedUrl, url)) return "bluesky";

    return "other";
  };

  const normalizeTwitterUrl = (url: string): string | null => {
    if (platform !== "twitter") return null;
    if (url.includes("t.co")) return url;

    return url.replace(
      /^(?:https?:\/\/)?(?:x\.com|twitter\.com)\/([^\/]+)\/status\/(\d+)/i,
      "https://twitter.com/$1/status/$2"
    );
  };

  // Derived values
  const platform = $derived(detectPlatform(url));
  const youtubeVideoId = $derived(
    platform === "youtube" ? getYoutubeVideoId(url) : null
  );
  const twitterUrl = $derived(normalizeTwitterUrl(url));

  const shouldAutoExpand = $derived.by(() => {
    const setting = lumiSetting.get().imageAutoExpand;
    return (
      setting === "all" ||
      (setting === "following" && followList.get().has(author))
    );
  });

  const shouldShowEmbed = $derived(
    (shouldAutoExpand || forceExpand) && lumiSetting.get().embed && !loadFailed
  );

  const shouldFallbackToOgp = $derived(loadFailed && platform !== "other");
  const shouldShowOgp = $derived(shouldFallbackToOgp || platform === "other");

  // Event handlers
  const handleOnError = () => {
    loadFailed = true;
  };
  const handleExpand = () => {
    forceExpand = true;
  };

  // Styles
  const expandButtonClass =
    "rounded-md border font-semibold border-magnum-600 text-magnum-200 p-1 m-1 hover:opacity-75 active:opacity-50";
</script>

{#if platform === "youtube" && youtubeVideoId}
  {#if shouldShowEmbed}
    <EmbedYoutube id={youtubeVideoId} onError={handleOnError} />
  {:else}
    <button class={expandButtonClass} onclick={handleExpand}>
      Expand {PLATFORM_LABELS.youtube}
    </button>
  {/if}
{:else if platform === "twitter" && twitterUrl}
  {#if shouldShowEmbed}
    <EmbedTwitter url={twitterUrl} originalUrl={url} onError={handleOnError} />
  {:else}
    <button class={expandButtonClass} onclick={handleExpand}>
      Expand {PLATFORM_LABELS.twitter}
    </button>
  {/if}
{:else if platform === "bluesky"}
  {#if shouldShowEmbed}
    <EmbedBluesky {url} onError={handleOnError} />
  {:else}
    <button class={expandButtonClass} onclick={handleExpand}>
      Expand {PLATFORM_LABELS.bluesky}
    </button>
  {/if}
{/if}

{#if shouldShowOgp}
  <OgpLoad {url} />
{/if}
