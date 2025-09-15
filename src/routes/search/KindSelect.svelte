<script lang="ts">
  import { eventKinds } from "$lib/func/kinds";
  import { createDropdownMenu, melt } from "@melt-ui/svelte";

  import { locale } from "@konemono/svelte5-i18n";
  import { fly } from "svelte/transition";

  interface Props {
    selectedKind?: string | undefined;
  }

  let { selectedKind = $bindable(undefined) }: Props = $props();
  const {
    elements: { trigger, menu, item, separator, arrow },

    states: { open },
  } = createDropdownMenu({
    forceVisible: true,
    loop: true,
  });

  const handleClickKind = (kind: number) => {
    selectedKind = kind.toString();
  };
</script>

<button
  type="button"
  class="text-magnum-400 hover:text-magnum-200 transition-colors cursor-pointer"
  use:melt={$trigger}
>
  K
</button>

{#if $open}
  <div
    class=" menu"
    use:melt={$menu}
    transition:fly={{ duration: 150, y: -10 }}
  >
    {#each Array.from(eventKinds.entries()) as [kind, { ja, en }]}
      <div
        class="item"
        use:melt={$item}
        onm-click={() => handleClickKind(kind)}
      >
        {kind}
        {$locale === "ja" ? ja : en}
      </div>
    {/each}
  </div>
{/if}

<style lang="postcss">
  .menu {
    @apply z-40 flex max-h-[min(100vh,400px)] min-w-[240px] flex-col shadow-lg overflow-y-auto cursor-pointer;
    @apply rounded-md bg-neutral-800 border border-neutral-700 p-1;
    @apply ring-0 !important;
  }

  .item {
    @apply hover:bg-neutral-700 p-1;
  }
</style>
