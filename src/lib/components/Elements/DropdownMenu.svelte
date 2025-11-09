<!--DropdownMenu-->
<script lang="ts">
  import { createDropdownMenu, melt } from "@melt-ui/svelte";
  import { fly } from "svelte/transition";
  import { ChevronRight } from "lucide-svelte";
  import { get } from "svelte/store";
  import type { Snippet } from "svelte";
  import type { MenuGroup } from "$lib/types";

  interface Props {
    menuGroups?: MenuGroup[];
    handleSelectItem: (action: string) => any;
    children?: Snippet;
    buttonClass?: string;
    zIndex?: number;
  }

  let {
    menuGroups = [],
    handleSelectItem,
    children,
    zIndex = 40,
    buttonClass = "hover:opacity-75 active:opacity-50 text-magnum-500/75 overflow-hidden w-fit",
  }: Props = $props();

  const {
    elements: { trigger, menu, item, separator },
    builders: { createSubmenu },
    states: { open },
  } = createDropdownMenu({
    loop: true,
  });

  const subMenus = menuGroups.map(() => {
    const {
      elements: { subTrigger, subMenu },
      states: { subOpen },
    } = createSubmenu();
    return { subTrigger, subMenu, subOpen };
  });
  let subM: any = $state();
  let subT: any = $state();

  subMenus.map((m) => {
    m.subTrigger.subscribe(() => {
      subT = subMenus.map((m) => get(m.subTrigger));
    });
  });
  subMenus.map((m) => {
    m.subTrigger.subscribe(() => {
      subM = subMenus.map((m) => get(m.subMenu));
    });
  });
</script>

<button type="button" class={buttonClass} use:melt={$trigger} aria-label="Menu">
  {@render children?.()}
</button>

{#if $open}
  <div
    class="menu"
    style="z-index:{zIndex}"
    use:melt={$menu}
    transition:fly={{ duration: 150, y: -10 }}
  >
    {#if menuGroups.length > 0 && menuGroups[0].label}
      <!-- グループあり -->
      {#each menuGroups as group, groupIndex}
        {#if groupIndex > 0}
          <div class="separator" use:melt={$separator}></div>
        {/if}

        <div class="item group-trigger" use:melt={subT[groupIndex]}>
          <span>{group.label}</span>
          <div class="rightSlot">
            <ChevronRight class="size-4" />
          </div>
        </div>

        <div class="menu subMenu" use:melt={subM[groupIndex]}>
          {#each group.items as { icon: Icon, text, action }}
            <div
              class="item"
              use:melt={$item}
              onclick={() => handleSelectItem(action)}
            >
              {#if Icon}<Icon class="icon mr-2 size-4" />{/if}
              {text}
            </div>
          {/each}
        </div>
      {/each}
    {:else}
      <!-- グループなし -->
      {#each menuGroups as group}
        {#each group.items as { icon: Icon, text, action }}
          <div
            class="item"
            use:melt={$item}
            onclick={() => handleSelectItem(action)}
          >
            {#if Icon}<Icon class="icon mr-2 size-4" />{/if}
            {text}
          </div>
        {/each}
      {/each}
    {/if}
  </div>
{/if}

<style lang="postcss">
  .menu {
    @apply flex max-h-[400px] min-w-[220px] flex-col shadow-lg;
    @apply rounded-md bg-neutral-800 p-1 shadow-black/30 lg:max-h-none;
    @apply ring-0 !important;
  }
  .subMenu {
    @apply min-w-[220px] shadow-md shadow-black/30;
  }
  .item {
    @apply relative h-8 min-h-[24px] select-none rounded-sm pl-6 pr-1;
    @apply text-magnum-50 outline-none;
    @apply data-[highlighted]:bg-magnum-700 data-[highlighted]:text-magnum-50;
    @apply data-[disabled]:text-neutral-600;
    @apply flex items-center text-sm leading-none;
    @apply ring-0 !important;
  }
  .group-trigger {
    @apply justify-between;
  }
  .rightSlot {
    @apply ml-auto text-magnum-500;
  }
  .separator {
    @apply m-[2px] h-[1px] bg-magnum-500/50;
  }
  .icon {
    @apply h-[13px] w-[13px];
  }
</style>
