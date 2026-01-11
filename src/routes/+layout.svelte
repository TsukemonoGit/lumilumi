<script lang="ts">
  //@ts-ignore
  import { pwaInfo } from "virtual:pwa-info";
  import { pwaAssetsHead } from "virtual:pwa-assets/head";

  // コンポーネントインポート
  import Header from "./Header.svelte";
  import Menu from "./Menu.svelte";
  import Sidebar from "./Sidebar.svelte";
  import Toast, { addToast } from "$lib/components/Elements/Toast.svelte";
  import LoadingElement from "$lib/components/LoadingElement.svelte";
  import NostrMain from "$lib/components/renderSnippets/nostr/NostrMain.svelte";
  import SetDefaultRelays from "$lib/components/renderSnippets/nostr/relay/SetDefaultRelays.svelte";
  import MediaDisplay from "$lib/components/Elements/MediaDisplay.svelte";
  import SetRepoReactions from "$lib/components/renderSnippets/nostr/SetRepoReactions.svelte";
  import Popstate from "./Popstate.svelte";
  import Modal from "./Modal.svelte";
  import DebugPanel2 from "$lib/components/Debug/DebugPanel2.svelte";

  // ストアインポート
  import {
    app,
    nowProgress,
    queryClient,
    viewMediaModal,
    ogDescription,
    ogTitle,
  } from "$lib/stores/stores";
  import {
    displayEvents,
    followList,
    loginUser,
    lumiSetting,
    showBanner,
    verifier,
    uploader,
  } from "$lib/stores/globalRunes.svelte";
  import { defaultRelays } from "$lib/stores/relays";

  // ユーティリティインポート
  import { onMount, type Snippet } from "svelte";
  import { pipe } from "rxjs";
  import { browser } from "$app/environment";
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { QueryClientProvider } from "@tanstack/svelte-query";
  import { latest, type EventPacket } from "rx-nostr";
  import { waitNostr } from "nip07-awaiter";

  // 機能関数インポート
  import {
    relaysReconnectChallenge,
    setRelays,
    setRxNostr,
    usePromiseReq,
  } from "$lib/func/nostr";
  import {
    rxNostr3RelaysReconnectChallenge,
    setRxNostr3,
  } from "$lib/func/reactions";
  import { setRelaysByKind10002 } from "$lib/stores/useRelaySet";
  import { initThemeSettings } from "$lib/func/theme";
  import { delay } from "$lib/func/util";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";

  // Workerインポート
  import workerUrl from "$lib/worker?worker&url";
  import {
    createNoopClient,
    createVerificationServiceClient,
  } from "rx-nostr-crypto";

  // 型インポート
  import type { UploaderOption } from "$lib/types";

  // スタイルインポート
  import "../app.css";
  import { getProfile } from "$lib/func/event";
  import { nip19 } from "nostr-tools";
  import LoginUserContacts from "$lib/components/renderSnippets/nostr/LoginUserContacts.svelte";

  // プロパティ定義
  let { data, children } = $props<{
    data:
      | {
          relays?: string[] | undefined;
        }
      | undefined;
    children: Snippet;
  }>();

  // 開発環境用のReact Query Devtools
  let SvelteQueryDevtools: any = $state();
  if (import.meta.env.MODE === "development") {
    import("@tanstack/svelte-query-devtools").then((module) => {
      SvelteQueryDevtools = module.SvelteQueryDevtools;
    });
  }

  // PWA manifest link
  let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : "");

  // 署名検証クライアント初期化（ブラウザ環境のみ）
  const verificationClient = browser
    ? createVerificationServiceClient({
        worker: new Worker(workerUrl, { type: "module" }),
        timeout: 600000,
      })
    : createNoopClient();
  verificationClient.start();
  verifier.set(verificationClient.verifier);

  // メディア表示モーダル管理
  let showModal: boolean = $state(false);
  let modalIndex: number = $state(0);
  let mediaList: string[] = $state.raw([]);

  viewMediaModal.subscribe((e) => {
    if (e && e.mediaList.length > 0) {
      modalIndex = e.index;
      mediaList = e.mediaList;
      setTimeout(() => {
        showModal = true;
      }, 0);
    }
  });

  // データリレー算出（dataに含まれるリレーとデフォルトリレーをマージ）
  let dataRelays = $derived(
    data?.relays && data?.relays.length > 0
      ? [...data.relays, ...defaultRelays].slice(
          0,
          Math.max(data.relays.length, 3),
        )
      : undefined,
  );

  // ユーザーのリレー情報を取得して設定
  async function setUserRelay() {
    const currentPubkey = lumiSetting.get().pubkey;

    // キャッシュから取得を試行
    const data: EventPacket[] | undefined = queryClient.getQueryData([
      "defaultRelay",
      currentPubkey,
    ]);

    if (data && data.length > 0) {
      const relays = setRelaysByKind10002(data[0].event);
      setRelays(relays);
    } else {
      // キャッシュになければネットワークから取得
      const relays = await usePromiseReq(
        {
          filters: [{ authors: [currentPubkey], kinds: [10002], limit: 1 }],
          operator: pipe(latest()),
        },
        undefined,
        undefined,
      );

      if (relays) {
        const processedRelays = setRelaysByKind10002(relays[0].event);
        setRelays(processedRelays);
      }
    }
  }

  // ページ可視性変更時の処理（リレー再接続）
  function onVisibilityChange() {
    if (document?.visibilityState === "visible") {
      relaysReconnectChallenge();
      rxNostr3RelaysReconnectChallenge();
    }
  }

  // ナビゲーション後の処理
  afterNavigate(async (navigate) => {
    // フォーム送信以外でページ遷移した場合は表示イベントをリセット
    if (navigate.type !== "form") {
      displayEvents.set([]);
    }
  });

  // 前回のpubkeyを記録（重複イベント防止用）
  let previousPubkey: string | undefined = $state();

  // Nostr Login認証イベントリスナー
  const handleNlAuth = (e: Event) => {
    const customEvent = e as CustomEvent;
    const pub = customEvent.detail.pubkey;

    // 同じpubkeyで連続してイベントが発火した場合はスキップ
    if (pub && pub === previousPubkey) {
      return;
    }

    if (pub) {
      previousPubkey = pub;
      loginUser.value = pub;
      console.log("Nostr Login認証イベントリスナー", pub);

      const currentSetting = lumiSetting.get().pubkey;
      console.log(currentSetting, pub);
      // 既存の設定と異なるアカウントでログインした場合
      if (currentSetting && currentSetting !== pub) {
        const userMeta: EventPacket | null | undefined =
          queryClient.getQueryData(["metadata", pub]);
        const prof = getProfile(userMeta?.event);
        const userName =
          prof?.display_name ||
          prof?.name ||
          `${nip19.npubEncode(pub).slice(0, 8)}}...`;

        addToast({
          data: {
            // 辞書キーを指定
            title: $_("account_change.title"),
            description: $_("account_change.description", {
              pub: userName,
            }),
            color: "bg-blue-500",

            action: {
              label: $_("account_change.action_label"),
              onClick: () => {
                lumiSetting.update((val) => ({
                  ...val,
                  pubkey: pub,
                }));
                try {
                  localStorage.setItem(
                    STORAGE_KEYS.LUMI_SETTINGS,
                    JSON.stringify(lumiSetting.get()),
                  );
                } catch (error) {
                  // エラーメッセージもi18n化
                  console.log($_("account_change.error_save"));
                }
                setUserRelay();
              },
            },
          },
        });
      } else if (!currentSetting) {
        // 未設定ユーザーの場合は自動で設定
        lumiSetting.update((val) => {
          return {
            ...val,
            pubkey: pub,
          };
        });
        try {
          localStorage.setItem(
            STORAGE_KEYS.LUMI_SETTINGS,
            JSON.stringify(lumiSetting.get()),
          );
        } catch (error) {
          console.log("Failed to save");
        }
        setUserRelay();
      }
    }
  };

  // nostr-login初期化済みフラグ
  let nostrLoginInitialized = false;

  // マウント時の初期化処理
  onMount(() => {
    document.addEventListener("nlAuth", handleNlAuth);

    // 非同期初期化処理
    (async () => {
      // ブラウザ環境での初期化
      if (browser) {
        // テーマ設定初期化
        try {
          initThemeSettings();
        } catch (error) {}

        // ローカルストレージからアップローダー設定読み込み
        try {
          const stored = localStorage.getItem(STORAGE_KEYS.UPLOADER);
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as UploaderOption;
              Object.assign(uploader, parsed);
            } catch {
              Object.assign(uploader, {
                type: "nip96",
                address: stored,
              } as UploaderOption);
            }
          }

          const banner: boolean =
            localStorage.getItem(STORAGE_KEYS.SHOW_BANNER) == "true";
          showBanner.value = banner;
        } catch (error) {}

        // RxNostr初期化
        if (!$app?.rxNostr) {
          setRxNostr();
        }
        if (!$app?.rxNostr3) {
          setRxNostr3();
        }

        // Nostr Login初期化（1度だけ実行）
        if (!nostrLoginInitialized) {
          const nostrLogin = await import("@konemono/nostr-login");
          await waitNostr(1000);

          try {
            await nostrLogin.init({
              description: `${$_("nostrlogin.description")}`,
            });
            nostrLoginInitialized = true;
          } catch (error) {
            console.log("Nostr Login initialization error:", error);
          }
        }
      }
    })();

    // クリーンアップ関数を返す
    return () => {
      document.removeEventListener("nlAuth", handleNlAuth);
    };
  });

  // 設定ページまたはバナー表示時のみnostr-loginを表示
  $effect(() => {
    if (browser) {
      const isSettingsPage = page.route.id === "/settings";
      const shouldShow = isSettingsPage || showBanner.value;
      document.body.classList.toggle("hide-nostr-login", !shouldShow);
    }
  });
</script>

<!-- ドキュメントレベルのイベントリスナー -->
<svelte:document on:visibilitychange={onVisibilityChange} />

<!-- ヘッダーメタ情報 -->
<svelte:head>
  <title>Lumilumi</title>
  <meta property="og:title" content={$ogTitle || "Lumilumi"} />
  <meta property="og:image" content={`${page.url.origin}/ogp.webp`} />
  <meta name="description" content={$ogDescription || "The Nostr Client"} />
  <meta
    property="og:description"
    content={$ogDescription || "The Nostr Client"}
  />

  {@html webManifestLink}

  {#if pwaAssetsHead.themeColor}
    <meta name="theme-color" content={pwaAssetsHead.themeColor.content} />
  {/if}

  {#each pwaAssetsHead.links as link}
    <link {...link} />
  {/each}
</svelte:head>

<!-- アプリケーション本体 -->
<Popstate />

<QueryClientProvider client={queryClient}>
  <NostrMain>
    {#snippet contents({ localRelays })}
      <SetDefaultRelays paramRelays={dataRelays} {localRelays}>
        {#snippet loading()}
          {#await delay(1000) then}
            Connecting to relays
          {/await}
        {/snippet}

        {#snippet error()}
          An error occurred while connecting to relays
        {/snippet}

        {#snippet contents()}
          <!-- 公開鍵が設定されている場合はコンタクトリスト読み込み -->
          {#if lumiSetting.get().pubkey}
            <LoginUserContacts />
          {/if}

          <Header />
          <SetRepoReactions />
          <Menu />
          <Toast />

          <!-- メディア表示モーダル -->
          <MediaDisplay
            bind:modalOpen={showModal}
            images={mediaList}
            bind:currentIndex={modalIndex}
          />

          <!-- メインコンテナ -->
          <div class="container">
            <main class="md:ml-52 xs:ml-0 ml-0 mt-8 md:mb-2 xs:mb-20 mb-20">
              {@render children?.()}

              <!-- プログレス表示 -->
              {#if $nowProgress}
                <div class="fixed right-10 bottom-20 z-[99]">
                  <LoadingElement />
                </div>
              {/if}
            </main>

            <!-- サイドバー -->
            <div class="fixed lift-0 top-0 md:w-52 xs:w-0 w-0">
              <Sidebar />
            </div>
          </div>
        {/snippet}
      </SetDefaultRelays>
    {/snippet}
  </NostrMain>

  <!-- React Query Devtools（開発環境のみ） -->
  {#if SvelteQueryDevtools}
    <SvelteQueryDevtools initialIsOpen={false} />
  {/if}
</QueryClientProvider>

<!-- PWAリロードプロンプト -->
{#await import("$lib/ReloadPrompt.svelte") then { default: ReloadPrompt }}
  <ReloadPrompt />
{/await}

<Modal />
<DebugPanel2 />
