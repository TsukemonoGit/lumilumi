<script lang="ts">
  //@ts-ignore
  import { pwaInfo } from "virtual:pwa-info";
  import { pwaAssetsHead } from "virtual:pwa-assets/head";

  import Header from "./Header.svelte";
  import { onMount } from "svelte";

  import {
    app,
    nowProgress,
    queryClient,
    slicedEvent,
    uploader,
    verifier,
    showBanner,
    viewMediaModal,
    ogDescription,
    ogTitle,
  } from "$lib/stores/stores";
  import { relaysReconnectChallenge, setRxNostr } from "$lib/func/nostr";
  import { browser } from "$app/environment";
  import "../app.css";

  import { setTheme } from "$lib/func/settings";
  import type { Theme } from "$lib/types";
  import Toast from "$lib/components/Elements/Toast.svelte";

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
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import ReactionToast from "$lib/components/Elements/ReactionToast.svelte";
  import {
    rxNostr3RelaysReconnectChallenge,
    setRxNostr3,
  } from "$lib/func/reactions";

  //import { SvelteQueryDevtools } from "@tanstack/svelte-query-devtools";

  //import SvelteQueryDevtools
  let SvelteQueryDevtools: any;

  // Conditionally load SvelteQueryDevtools during development
  if (import.meta.env.MODE === "development") {
    // Dynamically import SvelteQueryDevtools only in development mode
    import("@tanstack/svelte-query-devtools").then((module) => {
      SvelteQueryDevtools = module.SvelteQueryDevtools;
    });
  }

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
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log(
            "Service Worker registered with scope:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
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
      // console.log(theme);
      setTheme(theme);

      const tmp = localStorage.getItem("uploader");
      $uploader = tmp ?? mediaUploader[0];
      if (!$app?.rxNostr) {
        setRxNostr();
      }
      if (!$app?.rxNostr3) {
        setRxNostr3();
      }
      nlBanner = document.getElementsByTagName(
        "nl-banner"
      )?.[0] as HTMLElement | null;
      if (nlBanner) console.log(nlBanner);
    }
    if (!$showBanner && nlBanner) {
      nlBanner.style.display = "none";
    }
  });

  function onVisibilityChange() {
    if (document?.visibilityState === "visible") {
      relaysReconnectChallenge();
      rxNostr3RelaysReconnectChallenge();
    }
  }
  afterNavigate((navigate) => {
    console.log("afterNavigate", navigate.type);
    //ページが変わったらリセット
    if (navigate.type !== "form") {
      $slicedEvent = [];
    }
  });

  export let data:
    | {
        id: string;
        relays?: string[] | undefined;
        kind?: number | undefined;
        author?: string | undefined;
      }
    | undefined;
  $: baddrCheck($page, nlBanner, $showBanner);
  function baddrCheck(page: any, ba: any, ner: any) {
    if ($page.route.id === "/settings" && nlBanner) {
      nlBanner.style.display = "";
    } else if (nlBanner) {
      if ($showBanner) {
        nlBanner.style.display = "";
      } else {
        nlBanner.style.display = "none";
      }
    }
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
    //console.log(e);
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
  <title>Lumilumi</title
  ><!--ここを{$ogTitle}にするとMenubarの項目をホバーするだけでタイトル変わる謎になる-->

  <meta property="og:title" content={$ogTitle} />
  <meta property="og:image" content={`${$page.url.origin}/ogp.webp`} />

  <meta name="description" content={$ogDescription} />

  <meta property="og:description" content={$ogDescription} />

  {@html webManifestLink}
  {#if pwaAssetsHead.themeColor}
    <meta name="theme-color" content={pwaAssetsHead.themeColor.content} />
  {/if}
  {#each pwaAssetsHead.links as link}
    <link {...link} />
  {/each}

  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/makibishi-component@0.2.0/dist/reset.css"
  />
  <script
    type="module"
    src="https://cdn.jsdelivr.net/npm/makibishi-component@0.2.0/dist/makibishi-component.js"
  ></script>
  <!-- <script
    type="module"
    src="https://cdn.jsdelivr.net/npm/nostr-zap@1.1.0"
  ></script> -->
</svelte:head>

<QueryClientProvider client={$queryClient}>
  <NostrMain let:pubkey let:localRelays>
    <SetDefaultRelays paramRelays={data?.relays} {pubkey} {localRelays}>
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>
      <Header />
      <SetRepoReactions />
      <Menu />

      <Toast /><ReactionToast />
      <MediaDisplay
        bind:open={showModal}
        bind:images={mediaList}
        bind:currentIndex={modalIndex}
      />
      <div class="container">
        <!-- grid grid-cols-[auto_1fr]-->
        <main class="md:ml-52 xs:ml-0 ml-0 mt-8 md:mb-2 xs:mb-20 mb-20">
          <slot />
          {#if $nowProgress}
            <div class="fixed right-10 bottom-20 z-[99]">
              <LoadingElement />
            </div>
          {/if}
        </main>
        <div class="fixed lift-0 top-0 md:w-52 xs:w-0 w-0">
          <Sidebar />
        </div>
      </div>
    </SetDefaultRelays>
  </NostrMain>
  {#if SvelteQueryDevtools}
    <svelte:component this={SvelteQueryDevtools} initialIsOpen={false} />
  {/if}
  <!-- <SvelteQueryDevtools initialIsOpen={false} /> -->
</QueryClientProvider>
