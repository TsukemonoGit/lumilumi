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
    Users,
  } from "lucide-svelte";
  import { derived } from "svelte/store";
  import { fly } from "svelte/transition";
  import { loginUser } from "$lib/stores/stores";

  import UserAvatar2 from "./UserAvatar2.svelte";
  import { nip19 } from "nostr-tools";

  const items: {
    Icon: any;
    link: string | undefined;
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
      link: undefined,
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
</script>

<div class="menuGroup fixed bottom-5 right-5 z-20">
  <div use:melt={$menubar}>
    <button
      type="button"
      class="trigger"
      use:melt={$trigger}
      aria-label="Update dimensions"
    >
      <svelte:component this={$currentPageIcon} class="size-6" />

      <span class="sr-only">Open Popover</span>
    </button>

    <div
      class=" menu"
      use:melt={$menu}
      transition:fly={{ duration: 150, y: -10 }}
    >
      <nav class="p-2">
        <ul class="flex flex-wrap w-48 h-24 justify-around items-center">
          {#each items as { Icon, link, alt }}
            <li
              aria-current={$page.url?.pathname ===
              (link === undefined && $loginUser ? `/${encodedPub}` : link)
                ? "page"
                : undefined}
            >
              <a
                href={link ?? `/${encodedPub}`}
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
    @apply inline-flex items-center justify-center rounded-md bg-white px-3 py-3;
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
