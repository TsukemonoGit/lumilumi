<script lang="ts">
  import { page } from "$app/stores";
  import logo from "$lib/images/favicon.svg";
  import { loginUser, showImg } from "$lib/stores/stores";

  import {
    Globe,
    Search,
    Bell,
    Settings,
    House,
    Users,
    MessagesSquare,
    TrendingUp,
  } from "lucide-svelte";

  import { nip19 } from "nostr-tools";
  import UserAvatar2 from "./UserAvatar2.svelte";
  import EditUserStatus from "$lib/components/EditUserStatus.svelte";
  import { melt } from "@melt-ui/svelte";
  import type { MeltElement } from "@melt-ui/svelte/internal/helpers";
  import type { MeltActionReturn } from "@melt-ui/svelte/internal/types";

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
  let trigger: MeltElement<
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

<div class="sidebar fixed top-28 bottom-12">
  <nav class="h-full overflow-hidden">
    <ul class="flex flex-col gap-6 overflow-y-auto h-full">
      <li aria-current={$page.url?.pathname === "/" ? "page" : undefined}>
        <a href="/"><House /><span class="ml-2">Home</span></a>
      </li>

      <li
        aria-current={$page.url.pathname === "/notifications"
          ? "page"
          : undefined}
      >
        <a href="/notifications"
          ><Bell /><span class="ml-2">Notifications</span></a
        >
      </li>
      <li aria-current={$page.url.pathname === "/search" ? "page" : undefined}>
        <a href="/search"><Search /><span class="ml-2">search</span></a>
      </li>

      <li aria-current={$page.url.pathname === "/global" ? "page" : undefined}>
        <a href="/global"><Globe /><span class="ml-2">global</span></a>
      </li>
      <li aria-current={$page.url.pathname === "/channel" ? "page" : undefined}>
        <a href="/channel"
          ><MessagesSquare /><span class="ml-2">Channel</span></a
        >
      </li>
      <li aria-current={$page.url.pathname === "/list" ? "page" : undefined}>
        <a href="/list"><Users /><span class="ml-2">list</span></a>
      </li>

      <li
        aria-current={$page.url.pathname === `/${encodedPub}`
          ? "page"
          : undefined}
      >
        <a href={`/${encodedPub}`}
          ><UserAvatar2 size={28} /><span class="ml-2">profile</span>
        </a>
      </li>
      <li>
        {#if $trigger}<button use:melt={$trigger}
            ><TrendingUp /><span class="ml-2">Edit status</span></button
          >{/if}
      </li>
      <li
        aria-current={$page.url.pathname === "/settings" ? "page" : undefined}
      >
        <a href="/settings"><Settings /><span class="ml-2">settings</span></a>
      </li>
      <li
        class=" mt-auto"
        aria-current={$page.url.pathname === `/about` ? "page" : undefined}
      >
        <a href={`/about`}>
          {#if $showImg}
            <img
              loading="lazy"
              src="https://nostpic.com/media/cbcb0e0b602ec3a9adfc6956bfbe3e2bc12379ee13bf8505ce45f1c831d2e52a/419b9c108bea83bdbe5e4a17fd25f4bc401cfca547a49c1e99be2ebec8f5a203.webp"
              alt="lumi"
              width={80}
              height={80}
            />
          {:else}
            <img src={logo} alt="logo" width={40} height={40} />{/if}<span
            class="ml-2">about</span
          >
        </a>
      </li>
    </ul>
  </nav>
</div>
<EditUserStatus bind:trigger />

<style>
  @media screen and (max-width: 768px) {
    .sidebar {
      display: none;
    }
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
  a:hover {
    color: theme("colors.magnum.400");
  }
  button:hover {
    color: theme("colors.magnum.400");
  }
</style>
