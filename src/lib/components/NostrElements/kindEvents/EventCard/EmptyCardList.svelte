<script lang="ts">
  import EmptyCard from "./EmptyCard.svelte";

  interface Props {
    length?: number;
    children?: any;
  }

  let { length = 5, children }: Props = $props();
</script>

<div
  class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
>
  {#each Array.from({ length }) as _, i}
    {#if children}
      <EmptyCard>{@render children()}</EmptyCard>
    {:else}<EmptyCard />
    {/if}
  {/each}
</div>
