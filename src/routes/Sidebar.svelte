<script lang="ts">
  import { page } from "$app/state";
  import logo from "$lib/assets/favicon.svg";
  import { goto } from "$app/navigation";

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
    pubCheck(lumiSetting.value.pubkey),
  );

  let profileLink: string | undefined = $derived(
    encodedPub ? `/${encodedPub}` : undefined,
  );

  const aboutLink = "/about";

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

  // 現在ページ判定をここに集約。分岐を追加する場合はここ、または呼び出し側でこの戻り値を使う。
  function isCurrentPage(link?: string): boolean {
    if (!link) return false;
    return page.url.pathname === link;
  }

  function handleClickNav(e: MouseEvent, link?: string) {
    if (!link) return;
    if (isCurrentPage(link)) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      e.preventDefault();
      goto(link);
    }
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
          {#if lumiSetting.value.pubkey && profileLink}
            <li aria-current={isCurrentPage(profileLink) ? "page" : undefined}>
              <a
                href={profileLink}
                onclick={(e) => handleClickNav(e, profileLink)}
                ><UserAvatar2 size={24} /><span class="ml-1">profile</span>
              </a>
            </li>
          {:else}
            <li>
              <div class="disabledLink">
                <User /><span class="ml-1">profile</span>
              </div>
            </li>
          {/if}
        {:else if alt === "edit status"}
          <li>
            <button
              onclick={() => {
                $dialogOpen = true;
              }}><TrendingUp /><span class="ml-1">Edit status</span></button
            >
          </li>
        {:else}
          <li aria-current={isCurrentPage(link) ? "page" : undefined}>
            {#if noPubkey || lumiSetting.value.pubkey}
              <a
                href={link}
                title={alt}
                onclick={(e) => handleClickNav(e, link)}
              >
                <Icon /><span class="ml-1">{alt}</span>
              </a>
            {:else}
              <!--ぷぶキーセットされてないとクリックできない方のメニュー-->
              <div class="disabledLink" title={alt}>
                <Icon /><span class="ml-1">{alt}</span>
              </div>
            {/if}
          </li>{/if}
      {/each}

      <li
        class=" mt-auto"
        aria-current={isCurrentPage(aboutLink) ? "page" : undefined}
      >
        <a href={aboutLink} onclick={(e) => handleClickNav(e, aboutLink)}>
          {#if lumiSetting.value.showImg}
            <img
              loading="lazy"
              src={LumiIcon}
              alt="lumi"
              width={80}
              height={80}
            />
          {:else}
            <img src={logo} alt="logo" width={40} height={40} />{/if}<span
            class="ml-1">about</span
          >
        </a>
      </li>
    </ul>
  </nav>
</div>
<EditUserStatus bind:dialogOpen />

<style lang="postcss">
  @media screen and (max-width: 767px) {
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
  .disabledLink {
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
    color: theme("colors.neutral.600");
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
    color: theme("colors.magnum.300");
    @apply font-extrabold;
  }

  a:hover {
    color: theme("colors.magnum.300");
  }
  button:hover {
    color: theme("colors.magnum.300");
  }
</style>
