<script lang="ts">
  import type * as Nostr from "nostr-typedef";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { ChevronLeft, ExternalLink, Play, Podcast } from "@lucide/svelte";

  import Link from "#lib/components/Elements/Link.svelte";
  import EventCard from "#lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import Metadata from "#lib/components/renderSnippets/nostr/Metadata.svelte";
  import { encodetoNpub } from "#lib/func/encode.ts";
  import {
    buildPodcastTracks,
    parsePodcastEpisode,
    parsePodcastShow,
    sortEpisodesDesc,
  } from "#lib/func/podcast.ts";
  import { displayShortPub } from "#lib/func/util.ts";
  import { lumiSetting } from "#lib/stores/globalRunes.svelte.ts";
  import { playQueue } from "#lib/stores/mediaPlayer.svelte.ts";
  import { app } from "#lib/stores/stores.ts";
  import { useReplaceableEvent } from "#lib/stores/useReplaceableEvent.ts";
  import { useUniqueEventList } from "#lib/stores/useUniqueEventList.ts";

  interface Props {
    pubkey: string;
  }

  let { pubkey }: Props = $props();

  // 番組メタデータ（置換可能イベントなので最新のみ）
  let showResult = $derived(
    useReplaceableEvent(
      $app?.rxNostr,
      ["kind10154", pubkey],
      pubkey,
      10154,
    ),
  );
  let showData = $derived(showResult.data);
  let showPacket = $derived($showData);
  let show = $derived(
    showPacket?.event ? parsePodcastShow(showPacket.event) : undefined,
  );

  // 同一 pubkey が投稿したエピソード一覧
  let episodesResult = $derived(
    useUniqueEventList(
      ["podcast", pubkey, "episodes"],
      [{ kinds: [54], authors: [pubkey], limit: 100 }],
    ),
  );
  let episodesData = $derived(episodesResult.data);
  let episodesStatus = $derived(episodesResult.status);
  let episodesError = $derived(episodesResult.error);

  let episodes = $derived.by(() => {
    const events = ($episodesData ?? [])
      .map((packet) => packet.event)
      .filter((event) => event.kind === 54);
    return sortEpisodesDesc(events).map(parsePodcastEpisode);
  });
  let tracks = $derived(buildPodcastTracks(episodes, show));

  let title = $derived(show?.title || displayShortPub(pubkey));
  let npub = $derived(encodetoNpub(pubkey));
  let websites = $derived(show?.websites ?? []);
  // 画像URLが壊れている場合に壊れた画像アイコンを出さないためのフラグ
  let showImageFailed = $state(false);

  function playAll() {
    if (tracks.length > 0) playQueue(tracks, 0);
  }
</script>

{#snippet episodeList(metadata: Nostr.Event | undefined)}
  <div class="w-full divide-y-2 divide-magnum-700/20 break-words">
    {#each episodes as episode (episode.id)}
      <EventCard note={episode.event} {metadata} podcastQueue={tracks} />
    {/each}
  </div>
{/snippet}

<section class="p-2">
  <a
    href="/podcast"
    class="mb-2 inline-flex items-center gap-1 text-sm text-magnum-300 hover:opacity-80"
  >
    <ChevronLeft size={16} />
    {$_("podcast.backToList")}
  </a>

  <header class="mb-4 flex flex-col gap-3 xs:flex-row xs:items-start">
    {#if show?.image && !showImageFailed && lumiSetting.value.showImg}
      <img
        src={show.image}
        alt=""
        class="h-32 w-32 shrink-0 rounded-lg object-cover"
        onerror={() => (showImageFailed = true)}
      />
    {:else}
      <div
        class="flex h-32 w-32 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-magnum-400"
      >
        <Podcast size={40} />
      </div>
    {/if}

    <div class="min-w-0 flex-1">
      <h1 class="break-words text-2xl font-bold">{title}</h1>
      <a
        href={`/${npub}`}
        class="mt-1 inline-block break-all text-xs text-magnum-300 hover:opacity-80"
        >{npub}</a
      >
      {#if show?.description}
        <p
          class="mt-2 whitespace-pre-wrap break-words text-sm text-neutral-300/80"
        >
          {show.description}
        </p>
      {/if}

      {#if websites.length > 0}
        <div class="mt-2 flex flex-wrap gap-2">
          {#each websites as website}
            <Link
              href={website}
              className="inline-flex items-center gap-1 text-xs text-magnum-300 underline hover:opacity-80"
            >
              {$_("podcast.openWeb")}
              <ExternalLink size={12} />
            </Link>
          {/each}
        </div>
      {/if}

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onclick={playAll}
          disabled={tracks.length === 0}
          class="inline-flex items-center gap-1 rounded-full bg-magnum-600 px-4 py-1.5 text-sm font-semibold text-magnum-50 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play size={16} />
          {$_("podcast.playAll")}
        </button>
        <span class="text-sm text-neutral-400">
          {$_("podcast.episodes")} ({episodes.length})
        </span>
      </div>
    </div>
  </header>

  {#if $episodesError}
    <p class="rounded-md bg-red-500/10 p-3 text-sm text-red-300">
      {$_("podcast.loadError")}
    </p>
  {:else if episodes.length > 0}
    <Metadata queryKey={["metadata", pubkey]} {pubkey}>
      {#snippet loading()}{@render episodeList(undefined)}{/snippet}
      {#snippet nodata()}{@render episodeList(undefined)}{/snippet}
      {#snippet error()}{@render episodeList(undefined)}{/snippet}
      {#snippet content({ metadata })}{@render episodeList(metadata)}{/snippet}
    </Metadata>
  {:else if $episodesStatus === "loading"}
    <div class="space-y-2">
      {#each Array.from({ length: 4 }) as _, index (index)}
        <div class="animate-pulse rounded-md bg-zinc-800 p-4">
          <div class="mb-2 h-4 w-1/3 rounded bg-zinc-700"></div>
          <div class="h-3 w-full rounded bg-zinc-700"></div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="rounded-md bg-zinc-900/60 p-3 text-sm text-neutral-300/80">
      {$_("podcast.noEpisodes")}
    </p>
  {/if}
</section>
