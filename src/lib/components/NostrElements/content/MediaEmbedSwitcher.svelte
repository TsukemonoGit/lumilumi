<script lang="ts">
  import { isvalidURL, getYoutubeVideoId } from "$lib/func/ogp";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import EmbedYoutube from "./Embed/EmbedYoutube.svelte";
  import EmbedTwitter from "./Embed/EmbedTwitter.svelte";
  import EmbedBluesky from "./Embed/EmbedBluesky.svelte";
  import OgpLoad from "./OgpLoad.svelte";

  type PlatformType = "youtube" | "twitter" | "bluesky" | "other";

  interface URLPattern {
    domains: readonly string[];
    validPaths: readonly RegExp[];
    invalidPaths: readonly RegExp[];
    resourcePatterns?: readonly RegExp[];
  }

  // Props
  let { url, author }: { url: string; author: string } = $props();

  // State - loadFailedをembedStateに統合
  let embedState = $state<{
    forceExpand: boolean;
    loadFailed: boolean;
    hasAttemptedLoad: boolean;
  }>({
    forceExpand: false,
    loadFailed: false,
    hasAttemptedLoad: false,
  });

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

  // Platform detection (既存のロジックを維持)
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

  // Derived values
  const platform = $derived(detectPlatform(url));

  // プラットフォーム固有データを統合
  const platformData = $derived.by(() => {
    switch (platform) {
      case "youtube":
        return {
          id: getYoutubeVideoId(url),
          url: null,
          originalUrl: null,
        };
      case "twitter":
        const twitterUrl = url.includes("t.co")
          ? url
          : url.replace(
              /^(?:https?:\/\/)?(?:x\.com|twitter\.com)\/([^\/]+)\/status\/(\d+)/i,
              "https://twitter.com/$1/status/$2"
            );
        return {
          id: null,
          url: twitterUrl,
          originalUrl: url,
        };
      case "bluesky":
        return {
          id: null,
          url: url,
          originalUrl: null,
        };
      default:
        return { id: null, url: null, originalUrl: null };
    }
  });

  const shouldAutoExpand = $derived.by(() => {
    const setting = lumiSetting.get().imageAutoExpand;
    return (
      setting === "all" ||
      (setting === "following" && followList.get().has(author))
    );
  });

  // 表示ロジックを統合・簡素化
  const displayMode = $derived.by((): "embed" | "button" | "ogp" => {
    const canEmbed = platform !== "other";
    const shouldExpand = shouldAutoExpand || embedState.forceExpand;
    const embedEnabled = lumiSetting.get().embed;

    if (!canEmbed) {
      return "ogp";
    }

    if (!shouldExpand) {
      return "button";
    }

    if (!embedEnabled || embedState.loadFailed) {
      return "ogp";
    }

    return "embed";
  });

  // Event handlers
  const handleOnError = () => {
    embedState.loadFailed = true;
    embedState.hasAttemptedLoad = true;
  };

  const handleExpand = () => {
    embedState.forceExpand = true;
  };

  // Styles
  const expandButtonClass =
    "rounded-md border font-semibold border-magnum-600 text-magnum-200 p-1 m-1 hover:opacity-75 active:opacity-50";
</script>

<!-- 表示ロジックをswitch文で整理 -->
{#if displayMode === "embed"}
  {#if platform === "youtube" && platformData.id}
    <EmbedYoutube id={platformData.id} onError={handleOnError} />
  {:else if platform === "twitter" && platformData.url}
    <EmbedTwitter
      url={platformData.url}
      originalUrl={platformData.originalUrl || url}
      onError={handleOnError}
    />
  {:else if platform === "bluesky" && platformData.url}
    <EmbedBluesky url={platformData.url} onError={handleOnError} />
  {/if}
{:else if displayMode === "button"}
  <button class={expandButtonClass} onclick={handleExpand}>
    Expand {PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS]}
  </button>
{:else}
  <!-- displayMode === "ogp" または予期しない状態 -->
  <OgpLoad {url} />
{/if}
