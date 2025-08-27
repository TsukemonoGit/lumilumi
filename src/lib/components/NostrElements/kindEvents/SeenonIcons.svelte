<script lang="ts">
  import { Triangle } from "lucide-svelte";

  import { getRelaysById } from "$lib/func/nostr";

  import { displayEvents } from "$lib/stores/globalRunes.svelte";

  import SeenonIcon from "./SeenonIcon.svelte";

  interface Props {
    id: string;
    width: number;
  }

  const { id, width }: Props = $props();

  const size = 16;
  let viewAll = $state(false);
  const relays: string[] = $derived.by(() => {
    if (displayEvents.get()) {
      return getRelaysById(id);
    } else return [];
  });
</script>

{#if relays.length > 0}
  <div
    class="flex flex-wrap gap-1 align-baseline h-fit"
    style="width:{width}px "
  >
    {#each viewAll ? relays : relays.slice(0, 2) as url}
      <SeenonIcon {url} {size} zIndex={20} />
    {/each}
    {#if !viewAll && relays.length > 2}
      <button
        title="more"
        style="width:{width}px "
        onclick={() => {
          viewAll = true;
        }}
        class="hover:opacity-75 active:opacity-50 border border-zinc-600 rounded-sm flex justify-center"
      >
        <Triangle
          size={size - 2}
          class="rotate-180 text-zinc-600 fill-zinc-600"
        /></button
      >
    {:else if viewAll && relays.length > 2}
      <button
        title="less"
        style="width:{width}px "
        onclick={() => {
          viewAll = false;
        }}
        class="hover:opacity-75 active:opacity-50 border mx-0.5 border-zinc-600 rounded-sm flex justify-center"
      >
        <Triangle
          size={size - 2}
          class=" text-zinc-600 fill-zinc-600"
        /></button
      >
    {/if}
  </div>
{/if}
