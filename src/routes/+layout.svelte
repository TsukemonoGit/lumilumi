<script lang="ts">
  import Header from "./Header.svelte";
  import { onMount } from "svelte";

  import {
    app,
    nowProgress,
    queryClient,
    slicedEvent,
    uploader,
    verifier,
  } from "$lib/stores/stores";
  import { relaysReconnectChallenge, setRxNostr } from "$lib/func/nostr";
  import { browser } from "$app/environment";
  import "../app.css";
  import { pwaAssetsHead } from "virtual:pwa-assets/head";
  import { setTheme } from "$lib/func/settings";
  import type { Theme } from "$lib/types";
  import Toast from "$lib/components/Elements/Toast.svelte";
  //@ts-ignore
  import { pwaInfo } from "virtual:pwa-info";
  import { QueryClientProvider } from "@tanstack/svelte-query";
  import LoadingElement from "$lib/components/NostrMainData/LoadingElement.svelte";
  import Menu from "./Menu.svelte";
  import Sidebar from "./Sidebar.svelte";
  import { afterNavigate } from "$app/navigation";
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  import { page } from "$app/stores";
  import workerUrl from "$lib/worker?worker&url";
  import {
    createNoopClient,
    createVerificationServiceClient,
  } from "rx-nostr-crypto";

  $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : "";

  //https://github.com/penpenpng/rx-nostr/pull/138
  const verificationClient = browser
    ? createVerificationServiceClient({
        worker: new Worker(workerUrl, { type: "module" }),
      })
    : createNoopClient();
  verificationClient.start();
  $verifier = verificationClient.verifier;

  onMount(async () => {
    //https://vite-pwa-org.netlify.app/frameworks/sveltekit.html#auto-update
    if (pwaInfo) {
      // @ts-ignore
      const { registerSW } = await import("virtual:pwa-register");
      registerSW({
        immediate: true,
        onRegistered(r: any) {
          // uncomment following code if you want check for updates
          // r && setInterval(() => {
          //    console.log('Checking for sw update')
          //    r.update()
          // }, 20000 /* 20s for testing purposes */)
          console.log(`SW Registered: ${r}`);
        },
        onRegisterError(error: any) {
          console.log("SW registration error", error);
        },
      });
    }
    // make sure this is called before any
    // window.nostr calls are made
    if (browser) {
      const nostrLogin = await import("nostr-login");
      await nostrLogin.init({
        //methods: ["connect", "readOnly", "extension", "local"], //, 'otp']
        /*options*/
      });
      //await nostrLogin.launch();
      const theme = (localStorage?.getItem("theme") as Theme) ?? "system";
      console.log(theme);
      setTheme(theme);

      const tmp = localStorage.getItem("uploader");
      if (tmp) $uploader = tmp;
      if (!$app?.rxNostr) {
        setRxNostr();
      }
    }
  });

  function onVisibilityChange() {
    if (document?.visibilityState === "visible") {
      relaysReconnectChallenge();
    }
  }
  afterNavigate(() => {
    //ページが変わったらリセット
    $slicedEvent = [];
  });

  export let data:
    | {
        id: string;
        relays?: string[] | undefined;
        kind?: number | undefined;
        author?: string | undefined;
      }
    | undefined;
  $: console.log($page);
</script>

<svelte:document on:visibilitychange={onVisibilityChange} />
<svelte:head>
  <title>Lumilumi</title>
  <meta prefix="og:https://ogp.me/ns#" />
  <meta property="og:title" content="Lumilumi" />
  <meta property="og:image" content={`${$page.url.origin}/ogp.png`} />
  <meta
    property="og:description"
    content={$page.route.id === "/"
      ? "the nostr client"
      : $page.route.id?.includes("/channel")
        ? "channel"
        : $page.route.id?.includes("/list")
          ? "list"
          : $page.route.id === "/[npub=npub]"
            ? "User"
            : "the nostr client"}
  />
  {@html webManifestLink}
  {#if pwaAssetsHead.themeColor}
    <meta name="theme-color" content={pwaAssetsHead.themeColor.content} />
  {/if}
  {#each pwaAssetsHead.links as link}
    <link {...link} />
  {/each}
</svelte:head>

<QueryClientProvider client={$queryClient}>
  <NostrMain let:pubkey let:localRelays>
    <SetDefaultRelays paramRelays={data?.relays} {pubkey} {localRelays}>
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>
      <Header />

      <Menu />

      <Toast />
      <div class="container grid grid-cols-[auto_1fr]">
        <div class="sm:w-52 w-0">
          <Sidebar />
        </div>
        <main>
          <slot />
          {#if $nowProgress}
            <div class="fixed right-10 bottom-20">
              <LoadingElement />
            </div>
          {/if}
        </main>
      </div>
      <!-- <footer>
    <p>
      visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit
    </p>
  </footer> -->
    </SetDefaultRelays>
  </NostrMain>
</QueryClientProvider>
