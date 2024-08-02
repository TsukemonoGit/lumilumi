<script lang="ts">
  import { page } from "$app/stores";
  import { createDialog, createMenubar, melt } from "@melt-ui/svelte";
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
    X,
  } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";
  import { loginUser, menuLeft } from "$lib/stores/stores";

  import UserAvatar2 from "./UserAvatar2.svelte";
  import { nip19 } from "nostr-tools";
  import EditUserStatus from "$lib/components/EditUserStatus.svelte";
  import type { MeltActionReturn } from "@melt-ui/svelte/internal/types";
  import type { MeltElement } from "@melt-ui/svelte/internal/helpers";
  import logo from "$lib/images/favicon.svg";
  const {
    elements: {
      trigger,
      overlay,
      content,
      title,
      description,
      close,
      portalled,
    },
    states: { open },
  } = createDialog({
    forceVisible: true,
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
  // beforeNavigate(() => ($open = false));
</script>

<EditUserStatus bind:trigger={editStatustrigger} />
<div class="menuGroup fixed bottom-0 z-10 w-full h-14 bg-white">
  <div class="absolute {menuPosition2} h-full mt-2">
    <a href={`/${encodedPub}`} class="item cursor-pointer" title={"user page"}>
      <UserAvatar2 size={40} /></a
    >
  </div>
  <div class="absolute {menuPosition} mt-1">
    <!-- <div use:melt={$menubar}> -->
    <button
      type="button"
      class="trigger"
      use:melt={$trigger}
      aria-label="Update dimensions"
      ><AlignJustify class="size-6" />
      <!-- {#if $currentPageIcon}
        <svelte:component this={$currentPageIcon} class="size-4 align-bottom" />
      {/if} -->
    </button>
  </div>
</div>
<!-- </div> -->

{#if $open}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
    />
    <div
      use:melt={$content}
      class="fixed left-0 top-0 z-50 h-screen w-full max-w-[250px] bg-neutral-900 p-6
            shadow-lg focus:outline-none"
      transition:fly={{
        x: -350,
        duration: 300,
        opacity: 1,
      }}
    >
      <nav class="h-full overflow-hidden justify-between flex flex-col">
        <div class="title">
          <img src={logo} alt="logo" width={40} /><span class="ml-2"
            >Lumilumi</span
          >
        </div>

        <ul class="flex flex-col gap-6 overflow-y-auto max-h-full justify-end">
          <li aria-current={$page.url?.pathname === "/" ? "page" : undefined}>
            <a href="/" use:melt={$close}
              ><House /><span class="ml-2">Home</span></a
            >
          </li>

          <li
            aria-current={$page.url.pathname === "/notifications"
              ? "page"
              : undefined}
          >
            <a href="/notifications" use:melt={$close}
              ><Bell /><span class="ml-2">Notifications</span></a
            >
          </li>
          <li
            aria-current={$page.url.pathname === "/search" ? "page" : undefined}
          >
            <a href="/search" use:melt={$close}
              ><Search /><span class="ml-2">search</span></a
            >
          </li>

          <li
            aria-current={$page.url.pathname === "/global" ? "page" : undefined}
          >
            <a href="/global" use:melt={$close}
              ><Globe /><span class="ml-2">global</span></a
            >
          </li>
          <li
            aria-current={$page.url.pathname === "/channel"
              ? "page"
              : undefined}
          >
            <a href="/channel" use:melt={$close}
              ><MessagesSquare /><span class="ml-2">Channel</span></a
            >
          </li>
          <li
            aria-current={$page.url.pathname === "/list" ? "page" : undefined}
          >
            <a href="/list" use:melt={$close}
              ><Users /><span class="ml-2">list</span></a
            >
          </li>

          <li
            aria-current={$page.url.pathname === "/settings"
              ? "page"
              : undefined}
          >
            <a href="/settings" use:melt={$close}
              ><Settings /><span class="ml-2">settings</span></a
            >
          </li>
          <li>
            {#if $trigger}<button
                use:melt={$editStatustrigger}
                use:melt={$close}
                ><TrendingUp /><span class="ml-2">Edit status</span></button
              >{/if}
          </li>
          <!-- <li
            aria-current={$page.url.pathname === `/${encodedPub}`
              ? "page"
              : undefined}
          >
            <a href={`/${encodedPub}`}
              ><UserAvatar2 size={32} /><span class="ml-2">profile</span>
            </a>
          </li> -->
        </ul>
      </nav>
    </div>
  </div>
{/if}

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

  nav a {
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
    color: theme("colors.magnum.50");
    font-weight: 700;
    font-size: var(--text-xl);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-decoration: none;
    transition: color 0.2s linear;
  }

  nav button {
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
    color: theme("colors.magnum.50");
    font-weight: 700;
    font-size: var(--text-xl);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-decoration: none;
    transition: color 0.2s linear;
  }
  nav li[aria-current="page"] a {
    color: theme("colors.magnum.400");
  }

  a:hover {
    color: theme("colors.magnum.400");
  }
  button:hover {
    color: theme("colors.magnum.400");
  }
  .title {
    display: flex;

    align-items: center;
    padding: 0 0.5rem;
    color: theme("colors.magnum.400");
    font-weight: 700;
    font-size: var(--text-xl);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-decoration: none;
    transition: color 0.2s linear;
  }
</style>
