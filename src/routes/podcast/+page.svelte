<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import { MicSignal } from "@lucide/svelte";

  import PodcastShowCard from "#lib/components/Podcast/PodcastShowCard.svelte";
  import { latestByPubkey, parsePodcastShow } from "#lib/func/podcast.ts";
  import { useUniqueEventList } from "#lib/stores/useUniqueEventList.ts";
  import OpenPostWindow from "#lib/components/OpenPostWindow.svelte";

  // NIP-F4: kind:10154 は置換可能イベント。ユーザーのデフォルトリレーから取得する。
  const queryKey = ["podcast", "shows"];
  const filters = [{ kinds: [10154], limit: 100 }];

  let result = useUniqueEventList(queryKey, filters);
  let data = result.data;
  let status = result.status;
  let errorData = result.error;

  let shows = $derived.by(() => {
    const events = ($data ?? []).map((packet) => packet.event);
    return latestByPubkey(events)
      .sort((a, b) => b.created_at - a.created_at)
      .map(parsePodcastShow);
  });
</script>

<svelte:head>
  <title>{$_("podcast.title")} - Lumilumi</title>
</svelte:head>

<section class="p-2">
  <header class="mb-4 flex items-start gap-3">
    <MicSignal size={32} class="mt-1 shrink-0 text-magnum-400" />
    <div>
      <h1 class="text-2xl font-bold">{$_("podcast.title")}</h1>
      <p class="mt-1 text-sm text-neutral-300/80">
        {$_("podcast.listDescription")}
      </p>
    </div>
  </header>

  {#if $errorData}
    <p class="rounded-md bg-red-500/10 p-3 text-sm text-red-300">
      {$_("podcast.loadError")}
    </p>
  {:else if shows.length > 0}
    <div
      class="grid gap-3 xs:grid-cols-2 lg:grid-cols-3 max-w-full overflow-hidden"
    >
      {#each shows as show (show.pubkey)}
        <PodcastShowCard {show} />
      {/each}
    </div>
  {:else if $status === "loading"}
    <div class="grid gap-3 xs:grid-cols-2 lg:grid-cols-3">
      {#each Array.from({ length: 6 }) as _, index (index)}
        <div
          class="flex gap-3 rounded-lg border border-magnum-700/40 bg-zinc-900/40 p-3"
        >
          <div
            class="h-20 w-20 shrink-0 animate-pulse rounded bg-zinc-800"
          ></div>
          <div class="flex-1 space-y-2 py-1">
            <div class="h-4 w-2/3 animate-pulse rounded bg-zinc-800"></div>
            <div class="h-3 w-full animate-pulse rounded bg-zinc-800"></div>
            <div class="h-3 w-4/5 animate-pulse rounded bg-zinc-800"></div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="rounded-md bg-zinc-900/60 p-3 text-sm text-neutral-300/80">
      {$_("podcast.noShows")}
    </p>
  {/if}
</section>
<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>
