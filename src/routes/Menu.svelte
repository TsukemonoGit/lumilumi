<script lang="ts">
  import { page } from "$app/state";
  import { createDialog, melt } from "@melt-ui/svelte";
  import { AlignJustify, House, TrendingUp } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";
  import { loginUser } from "$lib/stores/stores";

  import UserAvatar2 from "./UserAvatar2.svelte";
  import { nip19 } from "nostr-tools";
  import EditUserStatus from "$lib/components/EditUserStatus.svelte";

  import logo from "$lib/assets/favicon.svg";
  import { goto } from "$app/navigation";
  import { writable, type Writable } from "svelte/store";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { mainMenuItems } from "./menu";
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

  let encodedPub: string = $state("");

  const pubCheck = () => {
    try {
      const pub = nip19.npubEncode($loginUser);
      if (pub) {
        encodedPub = pub;
      }
    } catch (error) {}
  };

  // beforeNavigate(() => ($open = false));

  function handleClickHome() {
    // 現在のパスが `/` ならトップにスクロール
    if (page.url?.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      goto("/");
    }
  }
  loginUser.subscribe((value) => {
    if (value) {
      pubCheck();
    }
  });
  let menuPosition = $derived(
    lumiSetting.get().menuleft ? "left-2 flex flex-row-reverse" : "right-2 "
  );
  let menuPosition2 = $derived(
    lumiSetting.get().menuleft ? "right-5 " : "left-5"
  );

  // svelte-ignore non_reactive_update
  let editStatusOpen: Writable<boolean> = writable(false);
  const openEditStatusDialog = () => {
    $editStatusOpen = true;
  };
</script>

<EditUserStatus bind:dialogOpen={editStatusOpen} />
<div
  class="menuGroup fixed bottom-0 z-10 w-full h-14 bg-neutral-900 border-t border-magnum-300/50"
>
  <!--/90 backdrop-blur-->
  <div class="absolute {menuPosition2} h-full mt-2">
    <a href={`/${encodedPub}`} class="item cursor-pointer" title={"user page"}>
      <UserAvatar2 size={36} /></a
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
    <button onclick={handleClickHome} class="trigger" title="Home"
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
    ></div>
    <div
      use:melt={$content}
      class={`fixed ${lumiSetting.get().menuleft ? "left-0" : "right-0"} top-0 z-50 h-full w-full max-w-[250px] bg-neutral-900 p-6
            shadow-lg focus:outline-none`}
      transition:fly={lumiSetting.get().menuleft
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
          {#each mainMenuItems.filter((item) => item.alt !== "profile") as { Icon, link, alt, noPubkey }}
            {#if alt === "edit status"}
              <li>
                <button onclick={openEditStatusDialog} use:melt={$close}
                  ><TrendingUp /><span class="ml-2">Edit status</span></button
                >
              </li>
            {:else}
              <li
                aria-current={page.url?.pathname ===
                (link === undefined && $loginUser ? `/${encodedPub}` : link)
                  ? "page"
                  : undefined}
              >
                {#if noPubkey || $loginUser}
                  <a
                    href={link ?? `/${encodedPub}`}
                    use:melt={$close}
                    title={alt}
                  >
                    <Icon /><span class="ml-2">{alt}</span>
                  </a>
                {:else}
                  <!--ぷぶキーセットされてないとクリックできない方のメニュー-->
                  <div class="disabledLink" use:melt={$close} title={alt}>
                    <Icon /><span class="ml-2">{alt}</span>
                  </div>
                {/if}
              </li>{/if}
          {/each}

          <li
            aria-current={page.url?.pathname === "/about" ? "page" : undefined}
          >
            <a href="/about" use:melt={$close}
              >{#if lumiSetting.get().showImg}
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
  @media screen and (max-width: 767px) {
    .menuGroup {
      display: block;
    }
  }

  .item {
    @apply relative w-[40px] h-[40px] select-none rounded-sm;
    @apply z-20 text-magnum-300 outline-none;
    @apply data-[highlighted]:bg-magnum-300 data-[highlighted]:text-magnum-300;
    @apply data-[disabled]:text-neutral-300;
    @apply flex items-center text-sm leading-none;
    @apply cursor-default ring-0 !important;
  }

  .trigger {
    @apply inline-flex items-end gap-1 justify-center rounded-md px-3 py-3;
    @apply text-magnum-300 transition-colors  data-[highlighted]:outline-none;
    @apply overflow-visible data-[highlighted]:bg-magnum-300 data-[highlighted]:ring-magnum-400 !important;
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
  .disabledLink {
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
    color: theme("colors.neutral.500");
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
