<script lang="ts">
  import { DropdownMenu } from "bits-ui";
  import { fly } from "svelte/transition";
  import { ChevronRight } from "lucide-svelte";
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

  let hasGroups = $derived(menuGroups.length > 0 && menuGroups[0].label);
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class={buttonClass} aria-label="Menu">
    {@render children?.()}
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content preventScroll={false}>
      {#snippet child({ wrapperProps, props, open })}{open}
        {#if open}
          <div {...wrapperProps}>
            <div
              {...props}
              class="menu"
              style="z-index:{zIndex}"
              transition:fly={{ duration: 150, y: -10 }}
            >
              {#if hasGroups}
                {#each menuGroups as group, groupIndex}
                  {#if groupIndex > 0}
                    <DropdownMenu.Separator class="separator" />
                  {/if}

                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger class="item group-trigger">
                      <span>{group.label}</span>
                      <div class="rightSlot">
                        <ChevronRight class="size-4" />
                      </div>
                    </DropdownMenu.SubTrigger>

                    <DropdownMenu.SubContent>
                      {#snippet child({
                        wrapperProps: subWrapperProps,
                        props: subProps,
                        open: subOpen,
                      })}
                        {#if subOpen}
                          <div {...subWrapperProps}>
                            <div
                              {...subProps}
                              class="menu subMenu"
                              transition:fly={{ duration: 150, x: -10 }}
                            >
                              {#each group.items as { icon: Icon, text, action }}
                                <DropdownMenu.Item
                                  class="item"
                                  onSelect={() => handleSelectItem(action)}
                                >
                                  {#if Icon}<Icon
                                      class="icon mr-2 size-4"
                                    />{/if}
                                  {text}
                                </DropdownMenu.Item>
                              {/each}
                            </div>
                          </div>
                        {/if}
                      {/snippet}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Sub>
                {/each}
              {:else}
                {#each menuGroups as group}
                  {#each group.items as { icon: Icon, text, action }}
                    <DropdownMenu.Item
                      class="item"
                      onSelect={() => handleSelectItem(action)}
                    >
                      {#if Icon}<Icon class="icon mr-2 size-4" />{/if}
                      {text}
                    </DropdownMenu.Item>
                  {/each}
                {/each}
              {/if}
            </div>
          </div>
        {/if}
      {/snippet}
    </DropdownMenu.Content></DropdownMenu.Portal
  >
</DropdownMenu.Root>

<style lang="postcss">
  :global(.menu) {
    @apply flex max-h-[400px] min-w-[160px] flex-col shadow-lg;
    @apply rounded-md bg-neutral-800 p-1 shadow-black/30 lg:max-h-none;
    @apply ring-0 !important;
  }

  :global(.subMenu) {
    @apply min-w-[160px] shadow-md shadow-black/30;
  }

  :global(.item) {
    @apply relative h-8 min-h-[24px] select-none rounded-sm pl-1 pr-1;
    @apply text-magnum-50 outline-none;

    @apply flex items-center text-sm leading-none cursor-default;
    @apply ring-0 !important;
  }
  :global(.item[data-highlighted]) {
    @apply bg-magnum-700 text-magnum-50;
  }
  :global(.item[data-disabled]) {
    @apply text-neutral-600;
  }
  :global(.group-trigger) {
    @apply justify-between;
  }

  :global(.rightSlot) {
    @apply ml-auto text-magnum-500;
  }

  :global(.separator) {
    @apply m-[2px] h-[1px] bg-magnum-500/50;
  }

  :global(.icon) {
    @apply h-[13px] w-[13px];
  }
</style>
