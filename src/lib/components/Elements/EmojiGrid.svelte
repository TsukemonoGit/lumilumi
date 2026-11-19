<script lang="ts">
  import { emojis } from "#lib/stores/stores.ts";
  import { RefreshCw } from "@lucide/svelte";
  import { untrack, type Snippet } from "svelte";
  import EmojiListUpdate from "#lib/components/SettingsElements/EmojiListUpdate.svelte";

  interface Props {
    query?: string;
    containerClass?: string;
    chunk?: number;
    onSelect: (emoji: string[]) => void;
    item: Snippet<[string[]]>;
    children?: Snippet;
  }

  let {
    query = "",
    containerClass = "",
    chunk = 100,
    onSelect,
    item,
    children,
  }: Props = $props();

  let limit = $state(untrack(() => chunk));

  let normalized = $derived(query.replace(":", "").toLowerCase());
  let filtered = $derived(
    normalized === ""
      ? $emojis.list
      : $emojis.list.filter((e) => e[0].toLowerCase().includes(normalized)),
  );
  let visible = $derived(filtered.slice(0, limit));

  $effect(() => {
    normalized;
    untrack(() => {
      limit = chunk;
    });
  });

  const handleScroll = (ev: Event) => {
    const el = ev.currentTarget as HTMLElement;
    if (
      el.scrollTop + el.clientHeight >= el.scrollHeight - 100 &&
      limit < filtered.length
    ) {
      limit += chunk;
    }
  };
</script>

<div class={containerClass} onscroll={handleScroll}>
  {#each visible as e}
    <button
      aria-label={`Select emoji ${e[0]}`}
      onclick={() => onSelect(e)}
      class="rounded-md border m-0.5 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
    >
      {@render item(e)}
    </button>
  {/each}

  {@render children?.()}

  <EmojiListUpdate
    buttonClass="sticky bottom-1 right-1 p-1  ml-auto h-fit w-fit rounded-full hover:bg-neutral-900 hover:text-magnum-300 active:scale-90  text-magnum-400 bg-neutral-900/50"
  >
    <RefreshCw />
  </EmojiListUpdate>
</div>