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
    uploader,
    verifier,
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
  import LoadingElement from "$lib/components/LoadingElement.svelte";
  import Menu from "./Menu.svelte";
  import Sidebar from "./Sidebar.svelte";
  import { afterNavigate } from "$app/navigation";
  import NostrMain from "$lib/components/renderSnippets/nostr/NostrMain.svelte";
  import SetDefaultRelays from "$lib/components/renderSnippets/nostr/relay/SetDefaultRelays.svelte";

  import workerUrl from "$lib/worker?worker&url";
  import {
    createNoopClient,
    createVerificationServiceClient,
  } from "rx-nostr-crypto";
  import { mediaUploader } from "$lib/func/constants";
  import MediaDisplay from "$lib/components/Elements/MediaDisplay.svelte";

  import SetRepoReactions from "$lib/components/renderSnippets/nostr/SetRepoReactions.svelte";
  import ReactionToast from "$lib/components/Elements/ReactionToast.svelte";
  import {
    rxNostr3RelaysReconnectChallenge,
    setRxNostr3,
  } from "$lib/func/reactions";
  import { writable, type Writable } from "svelte/store";
  import { displayEvents, showBanner } from "$lib/stores/globalRunes.svelte";
  import { defaultRelays } from "$lib/stores/relays";
  import DomainMigrationNotice from "$lib/components/DomainMigrationNotice.svelte";
  import { page } from "$app/state";

  let { data, children } = $props<{
    data:
      | {
          relays?: string[] | undefined;
        }
      | undefined;
    children: import("svelte").Snippet;
  }>();

  let SvelteQueryDevtools: any = $state();

  // Conditionally load SvelteQueryDevtools during development
  if (import.meta.env.MODE === "development") {
    // Dynamically import SvelteQueryDevtools only in development mode
    import("@tanstack/svelte-query-devtools").then((module) => {
      SvelteQueryDevtools = module.SvelteQueryDevtools;
    });
  }

  let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : "");

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
    // console.log(import.meta.env.MODE);
    // PWA プラグインによる登録を優先

    // try {
    //   //@ts-ignore
    //   const { registerSW } = await import("virtual:pwa-register");
    //   registerSW({
    //     immediate: true,
    //     registrationOptions: {
    //       type: "module", // ここで type を 'module' または 'classic' に設定
    //     },
    //     onRegistered(r: { update: () => void }) {
    //       console.log("Service Worker registered:", r);
    //       // 定期的に更新チェックを行う場合
    //       if (r) {
    //         setInterval(() => {
    //           console.log("Checking for SW update");
    //           r.update();
    //         }, 20 * 1000); // 20秒ごとに更新チェック
    //       }
    //     },
    //     onRegisterError(error: any) {
    //       console.error("SW registration error:", error);
    //     },
    //   });
    // } catch (error) {
    //   console.error("Failed to import virtual:pwa-register:", error);
    // }

    // // ブラウザがサービスワーカーをサポートしている場合
    // //  // ホームページにいるときにサービスワーカーを更新
    // if ("serviceWorker" in navigator && page.url.pathname === "/") {
    //   try {
    //     const registration = await navigator.serviceWorker.register(
    //       "/my-sw.js",
    //       {
    //         type: "module", // ここで type を明示
    //         updateViaCache: "none", // キャッシュ更新を強制
    //       }
    //     );
    //     console.log(
    //       "Service Worker registered with scope:",
    //       registration.scope
    //     );

    //     registration.update();
    //   } catch (error) {
    //     console.error("Service Worker registration failed:", error);
    //   }
    // }

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
      console.log(tmp);
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
      if (nlBanner) {
        showBanner.setBanner(nlBanner);
        console.log(nlBanner);
      }
    }
    const banner: boolean = localStorage.getItem("showBanner") == "true";

    // console.log(banner);
    showBanner.set(banner);
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
      displayEvents.set([]);

      //設定ページに変わった場合バナーを表示
      if (navigate.to?.route.id === "/settings" && nlBanner) {
        nlBanner.style.display = "";
        //設定ページ以外に変わった場合はshowBannerの値によっていれる
      } else if (nlBanner) {
        nlBanner.style.display = showBanner.get() ? "" : "none";
      }
    }
  });

  // svelte-ignore non_reactive_update
  let showModal: Writable<boolean> = writable(false);
  let modalIndex: number = $state(0);
  let mediaList: string[] = $state.raw([]);
  viewMediaModal.subscribe((e) => {
    if (e && e.mediaList.length > 0) {
      //  console.log(e);
      modalIndex = e.index;
      mediaList = e.mediaList;
      setTimeout(() => {
        $showModal = true;
      }, 0);
    }
  });

  let dataRelays = $derived(
    data?.relays && data?.relays.length > 0
      ? [...data.relays, ...defaultRelays].slice(
          0,
          Math.max(data.relays.length, 3)
        )
      : undefined
  ); //data.relaysにちょっとしかなかったらデフォリレーから足す
</script>

<svelte:document on:visibilitychange={onVisibilityChange} />
<svelte:head>
  <title>Lumilumi</title
  ><!--ここを{$ogTitle}にするとMenubarの項目をホバーするだけでタイトル変わる謎になる-->

  <meta property="og:title" content={$ogTitle} />
  <meta property="og:image" content={`${page.url.origin}/ogp.webp`} />

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

<QueryClientProvider client={queryClient}>
  <NostrMain>
    {#snippet loading()}
      <!---->
    {/snippet}
    {#snippet contents({ pubkey, localRelays })}
      <SetDefaultRelays paramRelays={dataRelays} {pubkey} {localRelays}>
        {#snippet loading()}
          loading
        {/snippet}

        {#snippet error()}error
        {/snippet}
        {#snippet contents({ relays, status })}
          <Header />
          <SetRepoReactions />
          <Menu />

          <Toast /><ReactionToast />
          <MediaDisplay
            bind:open={showModal}
            images={mediaList}
            bind:currentIndex={modalIndex}
          />
          <div class="container">
            <!-- grid grid-cols-[auto_1fr]-->
            <main class="md:ml-52 xs:ml-0 ml-0 mt-8 md:mb-2 xs:mb-20 mb-20">
              {@render children?.()}
              {#if $nowProgress}
                <div class="fixed right-10 bottom-20 z-[99]">
                  <LoadingElement />
                </div>
              {/if}
            </main>
            <div class="fixed lift-0 top-0 md:w-52 xs:w-0 w-0">
              <Sidebar />
            </div>
          </div>{/snippet}
      </SetDefaultRelays>
    {/snippet}
  </NostrMain>
  {#if SvelteQueryDevtools}
    <SvelteQueryDevtools initialIsOpen={false} />
  {/if}
  <!-- <SvelteQueryDevtools initialIsOpen={false} /> -->
</QueryClientProvider>
{#await import("$lib/ReloadPrompt.svelte") then { default: ReloadPrompt }}
  <ReloadPrompt />
{/await}

{#if page.url.origin === "https://lumilumi.vercel.app" || page.url.origin === "http://localhost:5173"}
  <DomainMigrationNotice />
{/if}
