<script lang="ts">
  import Header from "./Header.svelte";
  import { onMount } from "svelte";

  import { app, queryClient } from "$lib/stores/stores";
  import {
    getMetadataFromLocalStorage,
    //relaysReconnectChallenge,
    setRxNostr,
  } from "$lib/func/nostr";
  import { browser } from "$app/environment";
  import "../app.css";
  import { pwaAssetsHead } from "virtual:pwa-assets/head";
  import { setTheme } from "$lib/func/settings";
  import type { Theme } from "$lib/types";
  import Toast from "$lib/components/Elements/Toast.svelte";
  import { pwaInfo } from "virtual:pwa-info";
  import { QueryClientProvider } from "@tanstack/svelte-query";
  $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : "";
  onMount(async () => {
    // make sure this is called before any
    // window.nostr calls are made
    if (browser) {
      if (!$app?.rxNostr) {
        setRxNostr();
      }
      const nostrLogin = await import("nostr-login");
      nostrLogin.init({
        /*options*/
      });
      getMetadataFromLocalStorage();
      const theme = (localStorage?.getItem("theme") as Theme) ?? "system";
      console.log(theme);
      setTheme(theme);
    }
  });

  // function onVisibilityChange() {
  //   if (document?.visibilityState === "visible") {
  //     relaysReconnectChallenge();
  //   }
  // }
</script>

<!-- <svelte:document on:visibilitychange={onVisibilityChange} /> -->
<svelte:head>
  {@html webManifestLink}
  {#if pwaAssetsHead.themeColor}
    <meta name="theme-color" content={pwaAssetsHead.themeColor.content} />
  {/if}
  {#each pwaAssetsHead.links as link}
    <link {...link} />
  {/each}
</svelte:head>
<QueryClientProvider client={$queryClient}>
  <Header />
  <Toast />
  <main>
    <slot />
  </main>

  <footer>
    <p>
      visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit
    </p>
  </footer>
</QueryClientProvider>
<!-- 
<style>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    width: 100%;
    max-width: 64rem;
    margin: 0 auto;
    box-sizing: border-box;
  }

  footer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 12px;
  }

  footer a {
    font-weight: bold;
  }

  @media (min-width: 480px) {
    footer {
      padding: 12px 0;
    }
  }
</style> -->
