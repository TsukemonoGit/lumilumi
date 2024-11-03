<script lang="ts">
  import { page } from "$app/stores";
  import { createMenubar, melt } from "@melt-ui/svelte";
  import {
    AlignJustify,
    Bell,
    Globe,
    House,
    MessagesSquare,
    Search,
    Settings,
    TrendingUp,
    Users,
  } from "lucide-svelte";
  import { derived } from "svelte/store";
  import { fly } from "svelte/transition";
  import { loginUser, menuLeft } from "$lib/stores/stores";

  import UserAvatar2 from "./UserAvatar2.svelte";
  import { nip19 } from "nostr-tools";
  import EditUserStatus from "$lib/components/EditUserStatus.svelte";
  import type { MeltActionReturn } from "@melt-ui/svelte/internal/types";
  import type { MeltElement } from "@melt-ui/svelte/internal/helpers";
  import { mainMenuItems } from "./menu";

  const {
    elements: { menubar },
    builders: { createMenu },
  } = createMenubar();
  const {
    elements: { trigger, menu, item, separator },
  } = createMenu();

  // 現在のページに基づいてアイコンを設定
  export const currentPageIcon = derived(page, ($page) => {
    const currentItem = mainMenuItems.find(
      (item) => item.link === $page.url?.pathname
    );
    return currentItem ? currentItem.Icon : undefined;
  });

  let encodedPub: string;
  $: if ($loginUser) {
    pubCheck();
  }

  const pubCheck = () => {
    try {
      const pub = nip19.npubEncode($loginUser);
      if (pub) {
        encodedPub = pub;
      }
    } catch (error) {}
  };
  $: menuPosition = $menuLeft ? "left-5" : "right-5";
  $: menuPosition2 = $menuLeft ? "right-5" : "left-5";
  let editStatustrigger: MeltElement<
    [
      {
        update: (
          updater: import("svelte/store").Updater<boolean>,
          sideEffect?: ((newValue: boolean) => void) | undefined
        ) => void;
        set: (this: void, value: boolean) => void;
        subscribe(
          this: void,
          run: import("svelte/store").Subscriber<boolean>,
          invalidate?: import("svelte/store").Invalidator<boolean> | undefined
        ): import("svelte/store").Unsubscriber;
        get: () => boolean;
        destroy?: (() => void) | undefined;
      },
    ],
    (node: HTMLElement) => MeltActionReturn<any>,
    ([$open]: [boolean]) => {
      readonly "aria-haspopup": "dialog";
      readonly "aria-expanded": boolean;
      readonly type: "button";
    },
    string
  >;
</script>

<div class="menuGroup fixed bottom-0 z-10 w-full h-14 bg-white">
  <div class="absolute {menuPosition2} h-full mt-2">
    <a href={`/${encodedPub}`} class="item cursor-pointer" title={"user page"}>
      <UserAvatar2 size={40} /></a
    >
  </div>
  <div class="absolute {menuPosition} mt-1">
    <div use:melt={$menubar}>
      <button
        type="button"
        class="trigger"
        use:melt={$trigger}
        aria-label="Update dimensions"
        ><AlignJustify class="size-6" />
        {#if $currentPageIcon}
          <svelte:component
            this={$currentPageIcon}
            class="size-4 align-bottom"
          />
        {/if}
        <span class="sr-only">Open Popover</span>
      </button>

      <div
        class=" menu"
        use:melt={$menu}
        transition:fly={{ duration: 150, y: -10 }}
      >
        <nav class="p-2">
          <ul class="flex flex-wrap w-32 h-32 justify-around items-center">
            {#each mainMenuItems as { Icon, link, alt, noPubkey }}
              <li
                aria-current={$page.url?.pathname ===
                (link === undefined && $loginUser ? `/${encodedPub}` : link)
                  ? "page"
                  : undefined}
              >
                {#if noPubkey}
                  <a
                    href={link ?? `/${encodedPub}`}
                    class="item flex justify-center items-center"
                    use:melt={$item}
                    title={alt}
                  >
                    <svelte:component this={Icon} />
                  </a>
                {:else}
                  <!--ぷぶキーセットされてないとクリックできない方のメニュー-->
                  <div
                    class="text-neutral-500 item flex justify-center items-center"
                    use:melt={$item}
                    title={alt}
                  >
                    <svelte:component this={Icon} />
                  </div>
                {/if}
              </li>
            {/each}
            <li>
              {#if $editStatustrigger}<button
                  use:melt={$item}
                  use:melt={$editStatustrigger}
                  class="item flex justify-center"><TrendingUp /></button
                >{/if}
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</div>
<EditUserStatus bind:trigger={editStatustrigger} />

<style lang="postcss">
  .menuGroup {
    display: none;
  }
  @media screen and (max-width: 640px) {
    .menuGroup {
      display: block;
    }
  }

  .menu {
    @apply z-10 flex max-h-[300px]  flex-col shadow-lg shadow-neutral-900/30;
    @apply rounded-md bg-white p-1 lg:max-h-none;
    @apply ring-0 !important;
  }
  .subMenu {
    @apply min-w-[220px] shadow-md shadow-neutral-900/30;
  }
  .item {
    @apply relative w-[40px] h-[40px] select-none rounded-sm;
    @apply z-20 text-magnum-900 outline-none;
    @apply data-[highlighted]:bg-magnum-200 data-[highlighted]:text-magnum-900;
    @apply data-[disabled]:text-neutral-300;
    @apply flex items-center text-sm leading-none;
    @apply cursor-default ring-0 !important;
  }

  .trigger {
    @apply inline-flex items-end gap-1 justify-center rounded-md bg-white px-3 py-3;
    @apply text-magnum-900 transition-colors hover:bg-white/90 data-[highlighted]:outline-none;
    @apply overflow-visible data-[highlighted]:bg-magnum-200 data-[highlighted]:ring-magnum-400 !important;
    @apply text-sm font-medium leading-none focus:z-30 focus:ring;
  }
  .check {
    @apply absolute left-2 top-1/2 text-magnum-500;
    translate: 0 calc(-50% + 1px);
  }

  .dot {
    @apply h-[4.75px] w-[4.75px] rounded-full bg-magnum-900;
  }

  .separator {
    @apply m-[5px] h-[1px] bg-magnum-200;
  }

  .rightSlot {
    @apply ml-auto pl-5;
  }

  .check {
    @apply absolute left-0 inline-flex w-6 items-center justify-center;
  }
  .text {
    @apply pl-6 text-xs leading-6 text-neutral-600;
  }
</style>
