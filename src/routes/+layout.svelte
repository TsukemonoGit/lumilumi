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
    viewMediaModal,
    ogDescription,
    ogTitle,
  } from "$lib/stores/stores";
  import {
    relaysReconnectChallenge,
    setRelays,
    setRxNostr,
    usePromiseReq,
  } from "$lib/func/nostr";
  import { pipe } from "rxjs";
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
  import { LUMI_STORAGE_KEY, mediaUploader } from "$lib/func/constants";
  import MediaDisplay from "$lib/components/Elements/MediaDisplay.svelte";

  import SetRepoReactions from "$lib/components/renderSnippets/nostr/SetRepoReactions.svelte";
  import ReactionToast from "$lib/components/Elements/ReactionToast.svelte";
  import {
    rxNostr3RelaysReconnectChallenge,
    setRxNostr3,
  } from "$lib/func/reactions";
  import { writable, type Writable } from "svelte/store";
  import {
    displayEvents,
    loginUser,
    lumiSetting,
    showBanner,
    verifier,
  } from "$lib/stores/globalRunes.svelte";
  import { defaultRelays } from "$lib/stores/relays";
  //import DomainMigrationNotice from "$lib/components/DomainMigrationNotice.svelte";
  import { page } from "$app/state";
  import { t as _ } from "@konemono/svelte5-i18n";
  import Popstate from "./Popstate.svelte";
  import Modal from "./Modal.svelte";
  import "$lib/i18n/index.ts";
  import { latest, type EventPacket } from "rx-nostr";
  import { setRelaysByKind10002 } from "$lib/stores/useRelaySet";

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
  verifier.set(verificationClient.verifier);

  let nlBanner: HTMLElement | null = null;

  onMount(async () => {
    document.addEventListener("nlAuth", (e: Event) => {
      const customEvent = e as CustomEvent;
      const pub = customEvent.detail.pubkey;

      if (pub) {
        loginUser.set(pub);
        if (!lumiSetting.get().pubkey) {
          lumiSetting.update((val) => {
            return {
              ...val,
              pubkey: pub,
            };
          });
          //設定ない人で公開鍵ログインされたらそれで設定保存する
          localStorage.setItem(
            LUMI_STORAGE_KEY,
            JSON.stringify(lumiSetting.get())
          );
          setUserRelay();
        }
      }
      console.log(customEvent);
    });
    localStorage?.removeItem("preferred-locale");

    // make sure this is called before any
    // window.nostr calls are made
    if (browser && !nlBanner) {
      const nostrLogin = await import("nostr-login");
      await nostrLogin.init({
        //methods: ["connect", "readOnly", "extension", "local"], //, 'otp']
        /*options*/

        description: `${$_("nostrlogin.description")}`,
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

  //設定データない人で、nostr-loginに公開鍵セットされたら、デフォリレーを更新する
  async function setUserRelay() {
    const data: EventPacket[] | undefined = queryClient.getQueryData([
      "defaultRelay",
      lumiSetting.get().pubkey,
    ]);
    console.log(data);
    if (data) {
      // データがある場合はイベントの形を整えてセット
      const relays = setRelaysByKind10002(data[0].event);
      setRelays(relays);
    } else {
      const relays = await usePromiseReq(
        {
          filters: [
            { authors: [lumiSetting.get().pubkey], kinds: [10002], limit: 1 },
          ],
          operator: pipe(latest()),
        },
        undefined,
        undefined
      );
      console.log(relays);
      if (relays) {
        setRelays(setRelaysByKind10002(relays[0].event));
      }
    }
  }
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
</svelte:head>

<Popstate />
<QueryClientProvider client={queryClient}>
  <NostrMain>
    {#snippet loading()}
      <!---->
    {/snippet}
    {#snippet contents({ localRelays })}
      <SetDefaultRelays paramRelays={dataRelays} {localRelays}>
        {#snippet loading()}
          loading
        {/snippet}

        {#snippet error()}error
        {/snippet}
        {#snippet contents()}
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

<!-- {#if new URL(page.url.origin).hostname !== "lumilumi.app" && import.meta.env.PROD}
  <DomainMigrationNotice />
{/if} -->
<Modal />
