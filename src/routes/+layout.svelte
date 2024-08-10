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
    noBanner,
    viewMediaModal,
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
  import { mediaUploader } from "$lib/func/util";
  import MediaDisplay from "$lib/components/Elements/MediaDisplay.svelte";
  import type { Part } from "$lib/func/content";

  $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : "";

  //https://github.com/penpenpng/rx-nostr/pull/138
  const verificationClient = browser
    ? createVerificationServiceClient({
        worker: new Worker(workerUrl, { type: "module" }),
        timeout: 600000,
      })
    : createNoopClient();
  verificationClient.start();
  $verifier = verificationClient.verifier;

  let nlBanner: HTMLElement | null = null;

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
    if (browser && !nlBanner) {
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
      $uploader = tmp ?? mediaUploader[0];
      if (!$app?.rxNostr) {
        setRxNostr();
      }
      nlBanner = document.getElementsByTagName(
        "nl-banner"
      )?.[0] as HTMLElement | null;
      if (nlBanner) console.log(nlBanner);
    }
    if ($noBanner && nlBanner) {
      nlBanner.style.display = "none";
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

  $: if ($noBanner && nlBanner) {
    nlBanner.style.display = "none";
  } else if (nlBanner) {
    nlBanner.style.display = "";
  }

  let showModal: {
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
  };
  let modalIndex: number;
  let mediaList: Part[];
  viewMediaModal.subscribe((e) => {
    console.log(e);
    if ($viewMediaModal) {
      modalIndex = $viewMediaModal.index;
      mediaList = $viewMediaModal.mediaList;
      setTimeout(() => {
        $showModal = true;
      }, 0);
    }
  });
</script>

<svelte:document on:visibilitychange={onVisibilityChange} />
<svelte:head>
  <title>Lumilumi</title>

  <meta property="og:title" content="Lumilumi" />
  <meta property="og:image" content={`${$page.url.origin}/ogp.webp`} />
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
  <!-- <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/makibishi-component@0.2.0/dist/default-theme.css"
  /> -->
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/makibishi-component@VERSION/dist/reset.css"
  />
  <script
    type="module"
    src="https://cdn.jsdelivr.net/npm/makibishi-component@0.2.0/dist/makibishi-component.js"
  ></script>
  <script
    type="module"
    src="https://cdn.jsdelivr.net/npm/nostr-zap@1.0.1"
  ></script>
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
      <MediaDisplay
        bind:open={showModal}
        bind:images={mediaList}
        bind:currentIndex={modalIndex}
      />
      <div class="container">
        <!-- grid grid-cols-[auto_1fr]-->
        <main class="sm:ml-52 ml-0 mt-8">
          <slot />
          {#if $nowProgress}
            <div class="fixed right-10 bottom-20">
              <LoadingElement />
            </div>
          {/if}
        </main>
        <div class="fixed lift-0 top-0 sm:w-52 w-0">
          <Sidebar />
        </div>
      </div>
      <!-- <footer>
    <p>
      visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit
    </p>
  </footer> -->
    </SetDefaultRelays>
  </NostrMain>
</QueryClientProvider>
