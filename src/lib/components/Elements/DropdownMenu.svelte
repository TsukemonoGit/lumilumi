<script lang="ts">
  import { createDropdownMenu, melt } from "@melt-ui/svelte";

  import { fly } from "svelte/transition";

  export let menuTexts: { icon: any; text: string }[] = [];
  export let handleSelectItem: (arg0: number) => any;
  const {
    elements: { trigger, menu, item, separator, arrow, overlay },

    states: { open },
  } = createDropdownMenu({
    forceVisible: true,
    loop: true,
  });
</script>

<button
  type="button"
  class="hover:opacity-75 active:opacity-50 text-magnum-500/75 overflow-hidden"
  use:melt={$trigger}
  aria-label="Update dimensions"
  ><slot /><span class="sr-only">Open Popover</span></button
>

{#if $open}
  <div use:melt={$overlay} class="fixed inset-0 z-40" />
  <div
    class=" menu"
    use:melt={$menu}
    transition:fly={{ duration: 150, y: -10 }}
  >
    {#each menuTexts as { icon: Icon, text }, index}
      <div
        class="item"
        use:melt={$item}
        on:m-click={() => handleSelectItem(index)}
      >
        <Icon class="icon mr-2 size-4 " />{text}
      </div>
    {/each}
    <!-- <div class="item" use:melt={$item}>About Melt UI</div>
    <div class="item" use:melt={$item}>Check for Updates...</div>
    <div class="separator" use:melt={$separator} />
    <div class="item" use:melt={$checkboxItem}>
      <div class="check">
        {#if $settingsSync}
          <Check class="size-4" />
        {/if}
      </div>
      Settings Sync is On
    </div>
    <div class="item !hidden md:!flex" use:melt={$subTrigger}>
      Profiles
      <div class="rightSlot">
        <ChevronRight class="size-4" />
      </div>
    </div>
    {#if $subOpen}
      <div
        class="menu subMenu"
        use:melt={$subMenu}
        transition:fly={{ x: -50, duration: 150 }}
      >
        <div class="text">People</div>
        <div use:melt={$radioGroup}>
          {#each personsArr as person}
            <div class="item" use:melt={$radioItem({ value: person })}>
              <div class="check">
                {#if $isChecked(person)}
                  <div class="dot" />
                {/if}
              </div>
              {person}
            </div>
          {/each}
        </div>
      </div>
    {/if}
    <div use:melt={$separator} class="separator" />

    <div class="item" use:melt={$checkboxItemA}>
      <div class="check">
        {#if $hideMeltUI}
          <Check class="size-4" />
        {/if}
      </div>
      Hide Melt UI
      <div class="rightSlot">⌘H</div>
    </div>
    <div class="item" use:melt={$item} data-disabled>
      Show All Components
      <div class="rightSlot">⇧⌘N</div>
    </div>
    <div use:melt={$separator} class="separator" />
    <div class="item" use:melt={$item}>
      Quit Melt UI
      <div class="rightSlot">⌘Q</div>
    </div> -->
    <div use:melt={$arrow} />
  </div>
{/if}

<style lang="postcss">
  .menu {
    @apply z-40 flex max-h-[300px] min-w-[220px] flex-col shadow-lg;
    @apply rounded-md bg-magnum-950 p-1 shadow-black/30 lg:max-h-none;
    @apply ring-0 !important;
  }
  .subMenu {
    @apply min-w-[220px] shadow-md shadow-black/30;
  }
  .item {
    @apply relative h-10 min-h-[24px] select-none rounded-sm pl-6 pr-1;
    @apply z-40 text-magnum-50 outline-none;
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
