<script lang="ts">
  import { page } from "$app/stores";
  import { createMenubar, melt } from "@melt-ui/svelte";
  import {
    AlignJustify,
    Bell,
    Check,
    ChevronRight,
    Globe,
    House,
    MessagesSquare,
    Search,
    Settings,
    Users,
  } from "lucide-svelte";
  import { derived, writable } from "svelte/store";
  import { fly } from "svelte/transition";
  import { loginUser, queryClient } from "$lib/stores/stores";
  import type { EventPacket } from "rx-nostr";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import type { SvelteComponent } from "svelte";
  import UserAvatar2 from "./UserAvatar2.svelte";
  import { nip19 } from "nostr-tools";

  const items: {
    Icon: any;
    link: string;
    alt: string;
  }[] = [
    { Icon: House, link: "/", alt: "home" },
    { Icon: Bell, link: "/notifications", alt: "notifications" },
    { Icon: MessagesSquare, link: "/channel", alt: "channel" },
    { Icon: Users, link: "/list", alt: "list" },
    { Icon: Search, link: "/search", alt: "search" },
    { Icon: Globe, link: "/global", alt: "global" },
    { Icon: Settings, link: "/settings", alt: "settings" },
    {
      Icon: UserAvatar2,
      link: $loginUser ? `/${nip19.npubEncode($loginUser)}` : "/",
      alt: "user page",
    },
  ];
  const {
    elements: { menubar },
    builders: { createMenu },
  } = createMenubar();
  const {
    elements: { trigger, menu, item, separator },
    builders: { createSubmenu, createMenuRadioGroup },
  } = createMenu();

  // 現在のページに基づいてアイコンを設定
  const currentPageIcon = derived(page, ($page) => {
    const currentItem = items.find((item) => item.link === $page.url?.pathname);
    return currentItem ? currentItem.Icon : AlignJustify;
  });
</script>

<div class="fixed bottom-5 right-5 z-20">
  <div use:melt={$menubar}>
    <button
      type="button"
      class="trigger"
      use:melt={$trigger}
      aria-label="Update dimensions"
    >
      <svelte:component this={$currentPageIcon} class="size-5" />

      <span class="sr-only">Open Popover</span>
    </button>

    <div
      class=" menu"
      use:melt={$menu}
      transition:fly={{ duration: 150, y: -10 }}
    >
      <nav class="p-2">
        <ul class="flex flex-wrap w-32">
          {#each items as { Icon, link, alt }}
            <li
              aria-current={$page.url?.pathname === link ? "page" : undefined}
              class="w-[32px] h-[32px]"
            >
              <a
                href={link}
                class="item flex justify-center items-center"
                use:melt={$item}
                title={alt}
              >
                <svelte:component this={Icon} />
              </a>
            </li>
          {/each}
        </ul>
      </nav>
    </div>
  </div>
</div>

<style lang="postcss">
  .menu {
    @apply z-10 flex max-h-[300px]  flex-col shadow-lg shadow-neutral-900/30;
    @apply rounded-md bg-white p-1 lg:max-h-none;
    @apply ring-0 !important;
  }
  .subMenu {
    @apply min-w-[220px] shadow-md shadow-neutral-900/30;
  }
  .item {
    @apply relative w-[32px] h-[32px] select-none rounded-sm;
    @apply z-20 text-magnum-900 outline-none;
    @apply data-[highlighted]:bg-magnum-200 data-[highlighted]:text-magnum-900;
    @apply data-[disabled]:text-neutral-300;
    @apply flex items-center text-sm leading-none;
    @apply cursor-default ring-0 !important;
  }

  .trigger {
    @apply inline-flex items-center justify-center rounded-md bg-white px-3 py-2;
    @apply text-magnum-900 transition-colors hover:bg-white/90 data-[highlighted]:outline-none;
    @apply overflow-visible data-[highlighted]:bg-magnum-200 data-[highlighted]:ring-magnum-400 !important;
    @apply !cursor-default text-sm font-medium leading-none focus:z-30 focus:ring;
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
