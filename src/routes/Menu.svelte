<script lang="ts">
  import { page } from "$app/stores";
  import { createDialog, melt } from "@melt-ui/svelte";
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
  import { fade, fly } from "svelte/transition";
  import { loginUser, menuLeft, showImg } from "$lib/stores/stores";

  import UserAvatar2 from "./UserAvatar2.svelte";
  import { nip19 } from "nostr-tools";
  import EditUserStatus from "$lib/components/EditUserStatus.svelte";
  import type { MeltActionReturn } from "@melt-ui/svelte/internal/types";
  import type { MeltElement } from "@melt-ui/svelte/internal/helpers";
  import logo from "$lib/images/favicon.svg";
  import { goto } from "$app/navigation";
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
  $: menuPosition = $menuLeft ? "left-2 flex flex-row-reverse" : "right-2 ";
  $: menuPosition2 = $menuLeft ? "right-5 " : "left-5";
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

  function handleClickHome() {
    // 現在のパスが `/` ならトップにスクロール
    if ($page.url?.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      goto("/");
    }
  }
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
    </button>
    <button on:click={handleClickHome} class="trigger"
      ><House class="size-6" />
    </button>
  </div>
</div>
<!-- </div> -->

{#if $open}
  <div use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
    />
    <div
      use:melt={$content}
      class={`fixed ${$menuLeft ? "left-0" : "right-0"} top-0 z-50 h-full w-full max-w-[250px] bg-neutral-900 p-6
            shadow-lg focus:outline-none`}
      transition:fly={$menuLeft
        ? {
            x: -350,
            duration: 300,
            opacity: 1,
          }
        : {
            x: 350,
            duration: 300,
            opacity: 1,
          }}
    >
      <nav class="h-full justify-between flex flex-col my-2 overflow-hidden">
        <ul
          class="flex flex-col gap-6 overflow-y-auto mt-auto max-h-[100vh] mb-2"
        >
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
          <li
            aria-current={$page.url?.pathname === "/about" ? "page" : undefined}
          >
            <a href="/about" use:melt={$close}
              >{#if $showImg}
                <img
                  loading="lazy"
                  src="https://nostpic.com/media/cbcb0e0b602ec3a9adfc6956bfbe3e2bc12379ee13bf8505ce45f1c831d2e52a/419b9c108bea83bdbe5e4a17fd25f4bc401cfca547a49c1e99be2ebec8f5a203.webp"
                  alt="lumi"
                  width={80}
                  height={80}
                />
              {:else}
                <img
                  loading="lazy"
                  src={logo}
                  alt="logo"
                  width={40}
                  height={40}
                />{/if}<span class="ml-2">about</span></a
            >
          </li>
        </ul>
      </nav>
    </div>
  </div>
{/if}

<style lang="postcss">
  .menuGroup {
    display: none;
  }
  @media screen and (max-width: 768px) {
    .menuGroup {
      display: block;
    }
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
