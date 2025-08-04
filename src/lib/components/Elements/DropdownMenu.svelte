<script lang="ts">
  import { createDropdownMenu, melt } from '@melt-ui/svelte';

  import { fly } from 'svelte/transition';

  interface Props {
    menuTexts?: { icon: any; text: string }[];
    handleSelectItem: (arg0: number) => any;
    children?: import('svelte').Snippet;
    buttonClass?: string;
    zIndex?: number;
  }

  let {
    menuTexts = [],
    handleSelectItem,
    children,
    zIndex = 40,
    buttonClass = 'hover:opacity-75 active:opacity-50 text-magnum-500/75 overflow-hidden w-fit'
  }: Props = $props();
  const {
    elements: { trigger, menu, item, separator, arrow, overlay },

    states: { open }
  } = createDropdownMenu({
    forceVisible: true,
    loop: true
  });
</script>

<button
  type="button"
  class={buttonClass}
  use:melt={$trigger}
  aria-label="Update dimensions">{@render children?.()}</button
>{#if $open}
  <div
    use:melt={$overlay}
    class="fixed inset-0"
    style={`z-index:${zIndex}`}
  ></div>
  <div
    class=" menu"
    style={`z-index:${zIndex}`}
    use:melt={$menu}
    transition:fly={{ duration: 150, y: -10 }}
  >
    {#each menuTexts as { icon: Icon, text }, index}
      <div
        class="item"
        style={`z-index:${zIndex}`}
        use:melt={$item}
        on:m-click={() => handleSelectItem(index)}
      >
        {#if Icon}<Icon class="icon mr-2 size-4 " />{/if}{text}
      </div>
    {/each}

    <div use:melt={$arrow}></div>
  </div>
{/if}

<style lang="postcss">
  .menu {
    @apply flex max-h-[300px] min-w-[220px] flex-col shadow-lg;
    @apply rounded-md bg-magnum-950 p-1 shadow-black/30 lg:max-h-none;
    @apply ring-0 !important;
  }
  .subMenu {
    @apply min-w-[220px] shadow-md shadow-black/30;
  }
  .item {
    @apply relative h-10 min-h-[24px] select-none rounded-sm pl-6 pr-1;
    @apply text-magnum-50 outline-none;
    @apply data-[highlighted]:bg-magnum-700 data-[highlighted]:text-magnum-50;
    @apply data-[disabled]:text-neutral-600;
    @apply flex items-center text-sm leading-none;
    @apply ring-0 !important;
  }
  .trigger {
    @apply inline-flex h-9 w-9 items-center justify-center rounded-full bg-black;
    @apply text-magnum-50 transition-colors hover:bg-black/90;
    @apply data-[highlighted]:ring-magnum-500/75 data-[highlighted]:ring-offset-2 !important;
    @apply p-0 text-sm font-medium  data-[highlighted]:outline-none;
  }
  .check {
    @apply absolute left-2 top-1/2 text-magnum-400;
    translate: 0 calc(-50% + 1px);
  }

  .dot {
    @apply h-[4.75px] w-[4.75px] rounded-full bg-magnum-50;
  }

  .separator {
    @apply m-[5px] h-[1px] bg-magnum-700;
  }

  .rightSlot {
    @apply ml-auto pl-5;
  }

  .icon {
    @apply h-[13px] w-[13px];
  }
  .check {
    @apply absolute left-0 inline-flex w-6 items-center justify-center;
  }
  .text {
    @apply pl-6 text-xs leading-6 text-neutral-300;
  }
</style>
