<script lang="ts">
  import { page } from "$app/stores";
  import logo from "$lib/images/favicon.svg";
  import { loginUser, showImg } from "$lib/stores/stores";

  import { TrendingUp, User } from "lucide-svelte";

  import { nip19 } from "nostr-tools";
  import UserAvatar2 from "./UserAvatar2.svelte";
  import EditUserStatus from "$lib/components/EditUserStatus.svelte";
  import { melt } from "@melt-ui/svelte";
  import { mainMenuItems } from "./menu";

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
  let trigger: any;
</script>

<div class="sidebar fixed top-28 bottom-12">
  <nav class="h-full overflow-hidden">
    <ul class="flex flex-col gap-6 overflow-y-auto h-full">
      {#each mainMenuItems as { Icon, link, alt, noPubkey }}
        {#if !link}
          {#if !Icon}
            <li
              aria-current={$page.url.pathname === `/${encodedPub}`
                ? "page"
                : undefined}
            >
              {#if $loginUser}<a href={`/${encodedPub}`}
                  ><UserAvatar2 size={28} /><span class="ml-2">profile</span>
                </a>{:else}<div class="disabledLink">
                  <User /><span class="ml-2">profile</span>
                </div>{/if}
            </li>
          {:else}
            <li>
              {#if $trigger}<button use:melt={$trigger}
                  ><TrendingUp /><span class="ml-2">Edit status</span></button
                >{/if}
            </li>
          {/if}
        {:else}
          <li
            aria-current={$page.url?.pathname ===
            (link === undefined && $loginUser ? `/${encodedPub}` : link)
              ? "page"
              : undefined}
          >
            {#if noPubkey || $loginUser}
              <a href={link ?? `/${encodedPub}`} title={alt}>
                <svelte:component this={Icon} /><span class="ml-2">{alt}</span>
              </a>
            {:else}
              <!--ぷぶキーセットされてないとクリックできない方のメニュー-->
              <div class="disabledLink" title={alt}>
                <svelte:component this={Icon} /><span class="ml-2">{alt}</span>
              </div>
            {/if}
          </li>{/if}
      {/each}

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
