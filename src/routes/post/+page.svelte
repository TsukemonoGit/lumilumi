<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { delay } from "$lib/func/util";
  import {
    additionalPostOptions,
    nowProgress,
    postWindowOpen,
  } from "$lib/stores/stores";
  import type { LumiSetting } from "$lib/types";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { convertMetaTags } from "$lib/func/imeta";
  import {
    loginUser,
    lumiSetting,
    uploader,
  } from "$lib/stores/globalRunes.svelte";
  import { beforeNavigate } from "$app/navigation";
  import { waitNostr } from "nip07-awaiter";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { filesUpload } from "$lib/func/upload";

  let tags: string[][] = [];
  let signPubkey: string | undefined = $state();
  let sharedContent: string; // = [data.title, data.text, data.url]
  //   .filter(Boolean)
  //   .join("\n");
  const setSettings = async () => {
    $nowProgress = true;
    try {
      const lumi = localStorage.getItem(STORAGE_KEYS.LUMI_SETTINGS);

      if (lumi) {
        const savedSettings: LumiSetting = JSON.parse(lumi);

        lumiSetting.get().showImg = savedSettings.showImg;
        lumiSetting.get().showPreview = savedSettings.showPreview;
      }
    } catch (error) {
      console.log(error);
    }

    if (!loginUser.get()) {
      const pubkey = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
      if (pubkey) {
        loginUser.set(pubkey);
      }
    }

    if (loginUser.get()) {
      console.log(loginUser.get());
      signPubkey = loginUser.get();
    }
    $nowProgress = false;
  };

  onMount(async () => {
    console.log("onMount");

    await setSettings();

    const paramTitle = page.url.searchParams.get("title");
    const paramText = page.url.searchParams.get("text");
    const paramUrl = page.url.searchParams.get("url");
    const paramSharedContent = [paramTitle, paramText, paramUrl]
      .filter((param) => param && param !== "undefined")
      .join("\n");

    if (paramSharedContent && paramSharedContent !== "") {
      additionalPostOptions.set({
        tags: tags,
        addableUserList: [],
        defaultUsers: [],
        warningText: undefined,
        content: paramSharedContent,
      });

      // ポストウィンドウを開く
      setTimeout(() => {
        $postWindowOpen = true;
      }, 1);
    } else if (navigator.serviceWorker) {
      console.log("serviceWorker");
      // メッセージを受け取るリスナーを設定
      navigator.serviceWorker.addEventListener("message", async (event) => {
        console.log("message", event);
        const data = event.data;
        if (!data) return;
        sharedContent = [data.title, data.text, data.url]
          .filter((data) => data !== undefined)
          .filter(Boolean)
          .join("\n");
        //URL共有
        if (!data.media || data.media.length <= 0) {
          // Svelteのストアに新しいオプションをセット
          additionalPostOptions.set({
            tags: tags,
            addableUserList: [],
            defaultUsers: [],
            warningText: undefined,
            content: sharedContent,
          });

          // ポストウィンドウを開く
          setTimeout(() => {
            $postWindowOpen = true;
          }, 1);
          return;
        }
        //画像共有
        if (data.media) {
          // キャッシュからファイルを取得し FileList を作成
          const cache = await caches.open("media-cache");
          const files = await Promise.all(
            data.media.map(async (fileUrl: string) => {
              const cachedResponse = await cache.match(fileUrl);
              if (cachedResponse) {
                const blob = await cachedResponse.blob();
                return new File([blob], fileUrl.split("/").pop() || "unknown", {
                  type: blob.type,
                });
              }
            })
          ).then((files) => files.filter(Boolean));

          // FileListを生成してハンドル関数に渡す
          const fileList = createFileList(files as File[]);
          //初期化待ち
          await waitNostr(1000);
          handleFilesUpload(fileList, sharedContent);
        }
      });
      // サービスワーカーが準備完了した後にメッセージを送信
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          console.log("Service Worker is active");
          registration.active.postMessage({ type: "requestLatestData" });
        }
      });
    }
  });

  // FileListを作成するためのユーティリティ関数
  function createFileList(files: File[]): FileList {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    return dataTransfer.files;
  }

  async function handleFilesUpload(
    files: FileList | null,
    initialContent: string
  ) {
    let sharedContent: string = initialContent ?? "";
    try {
      if (files) {
        $nowProgress = true;
        // ファイルアップロード
        const urlResults = await filesUpload(files, $uploader);

        // URLが正常にアップロードされているかチェック
        urlResults.map(async (data) => {
          if (data.status === "success") {
            const url = data.nip94_event?.tags.find(
              (tag) => tag[0] === "url"
            )?.[1];
            if (url) {
              // imetaをタグに追加
              if (data.nip94_event) {
                tags.push(convertMetaTags(data.nip94_event));
              }
              sharedContent = `${sharedContent}\n${url}`;
              // 500ms待機するPromise //image not foundになるのを避けるため
              await delay(2000);
              console.log(sharedContent);
              $nowProgress = false;
            }
          }
        });
      }
      // Svelteのストアに新しいオプションをセット
      additionalPostOptions.set({
        tags: tags,
        addableUserList: [],
        defaultUsers: [],
        warningText: undefined,
        content: sharedContent,
      });

      // ポストウィンドウを開く
      setTimeout(() => {
        $postWindowOpen = true;
      }, 1);
    } catch (error) {
      console.error("ファイルアップロードの処理でエラーが発生しました:", error);
    }
  }

  function deleteCache() {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          console.log("キャッシュが削除されました");
        }
      };
      navigator.serviceWorker.controller.postMessage({ type: "DELETE_CACHE" }, [
        messageChannel.port2,
      ]);
    }
  }

  beforeNavigate((nav) => {
    deleteCache();
  });

  window.addEventListener("beforeunload", (event) => {
    deleteCache();
  });
</script>

<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
    propSignPubkey={signPubkey}
  />
</div>
