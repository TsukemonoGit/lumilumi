<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import { Podcast } from "@lucide/svelte";

  import { encodetoNpub } from "#lib/func/encode.ts";
  import type { PodcastShow } from "#lib/func/podcast.ts";
  import { lumiSetting } from "#lib/stores/globalRunes.svelte.ts";

  interface Props {
    show: PodcastShow;
  }

  let { show }: Props = $props();

  let href = $derived(`/podcast/${encodetoNpub(show.pubkey)}`);
  let title = $derived(show.title || $_("podcast.untitledShow"));
  let imageFailed = $state(false);
</script>

<a
  {href}
  class="flex gap-3 rounded-lg border border-magnum-700/40 bg-zinc-900/40 p-3 transition hover:border-magnum-500 hover:bg-zinc-800/40 active:scale-[0.99]"
  title={title}
>
  {#if show.image && !imageFailed && lumiSetting.value.showImg}
    <img
      src={show.image}
      alt=""
      loading="lazy"
      class="h-20 w-20 shrink-0 rounded object-cover"
      onerror={() => (imageFailed = true)}
    />
  {:else}
    <div
      class="flex h-20 w-20 shrink-0 items-center justify-center rounded bg-zinc-800 text-magnum-400"
    >
      <Podcast size={28} />
    </div>
  {/if}

  <div class="min-w-0 flex-1">
    <div class="truncate font-bold text-zinc-100">{title}</div>
    {#if show.description}
      <p
        class="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm text-neutral-300/80"
      >
        {show.description}
      </p>
    {/if}
    {#if show.websites[0]}
      <p class="mt-1 truncate text-xs text-magnum-300/80">
        {show.websites[0]}
      </p>
    {/if}
  </div>
</a>
