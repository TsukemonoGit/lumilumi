<script lang="ts">
  import { page } from "$app/state";
  import logo from "$lib/assets/favicon.svg";

  import { TrendingUp, User } from "lucide-svelte";

  import * as nip19 from "nostr-tools/nip19";
  import UserAvatar2 from "./UserAvatar2.svelte";
  import EditUserStatus from "$lib/components/EditUserStatus.svelte";
  //  import { melt } from "@melt-ui/svelte";
  import { mainMenuItems } from "./menu";
  import { writable, type Writable } from "svelte/store";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import LumiIcon from "$lib/assets/lumi-chan.webp";

  let encodedPub: string | undefined = $derived(
    pubCheck(lumiSetting.get().pubkey)
  );

  function pubCheck(hex: string | undefined): string | undefined {
    if (hex) {
      try {
        const pub = nip19.npubEncode(hex);
        if (pub) {
          return pub;
        }
      } catch (error) {}
    }
    return undefined;
  }

  // svelte-ignore non_reactive_update
  let dialogOpen: Writable<boolean> = writable(false);
  // $inspect(page.url.pathname);
</script>

<div class="sidebar fixed top-28 bottom-12">
  <nav class="h-full overflow-hidden">
    <ul class="flex flex-col gap-6 overflow-y-auto h-full">
      {#each mainMenuItems as { Icon, link, alt, noPubkey }}
        {#if alt === "profile"}
          {#if lumiSetting.get().pubkey && encodedPub}
            <li
              aria-current={page.url.pathname === `/${encodedPub}`
                ? "page"
                : undefined}
            >
              <a href={`/${encodedPub}`}
                ><UserAvatar2 size={24} /><span class="ml-2">profile</span>
              </a>
            </li>
          {:else}
            <li>
              <div class="disabledLink">
                <User /><span class="ml-2">profile</span>
              </div>
            </li>
          {/if}
        {:else if alt === "edit status"}
          <li>
            <button
              onclick={() => {
                $dialogOpen = true;
              }}><TrendingUp /><span class="ml-2">Edit status</span></button
            >
          </li>
        {:else}
          <li aria-current={page.url.pathname === link ? "page" : undefined}>
            {#if noPubkey || lumiSetting.get().pubkey}
              <a href={link} title={alt}>
                <Icon /><span class="ml-2">{alt}</span>
              </a>
            {:else}
              <!--ぷぶキーセットされてないとクリックできない方のメニュー-->
              <div class="disabledLink" title={alt}>
                <Icon /><span class="ml-2">{alt}</span>
              </div>
            {/if}
          </li>{/if}
      {/each}

      <li
        class=" mt-auto"
        aria-current={page.url.pathname === `/about` ? "page" : undefined}
      >
        <a href={`/about`}>
          {#if lumiSetting.get().showImg}
            <img
              loading="lazy"
              src={LumiIcon}
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
<EditUserStatus bind:dialogOpen />

<style>
  @media screen and (max-width: 767px) {
    .sidebar {
      display: none;
    }
  }

  nav a {
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
    color: rgb(var(--color-magnum-50));
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
    color: rgb(var(--color-magnum-50));
    font-weight: 700;
    font-size: var(--text-xl);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-decoration: none;
    transition: color 0.2s linear;
  }
  nav li[aria-current="page"] a {
    color: rgb(var(--color-magnum-400));
  }
  /* .title {
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
  } */
  a:hover {
    color: rgb(var(--color-magnum-400));
  }
  button:hover {
    color: rgb(var(--color-magnum-400));
  }
</style>
