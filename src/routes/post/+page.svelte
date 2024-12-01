<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { convertMetaTags, delay, filesUpload } from "$lib/func/util";
  import {
    additionalPostOptions,
    nowProgress,
    postWindowOpen,
    uploader,
    showPreview,
    showImg,
  } from "$lib/stores/stores";
  import type { LumiSetting } from "$lib/types";
  import { onMount } from "svelte";
  import { mediaUploader } from "$lib/func/constants";
  import { page } from "$app/stores";

  const paramTitle = $page.url.searchParams.get("title");
  const paramText = $page.url.searchParams.get("text");
  const paramUrl = $page.url.searchParams.get("url");
  const paramSharedContent = [paramTitle, paramText, paramUrl]
    .filter((param) => param !== null)
    .join("\n");

  let tags: string[][] = [];
  let signPubkey: string | undefined = $state();
  let sharedContent: string; // = [data.title, data.text, data.url]
  //   .filter(Boolean)
  //   .join("\n");
  // $: console.log(data);
  const setSettings = async () => {
    $nowProgress = true;
    const lumi = localStorage.getItem("lumiSetting");
    try {
      if (lumi) {
        const savedSettings: LumiSetting = JSON.parse(lumi);

        $showImg = savedSettings.showImg;
        $showPreview = savedSettings.showPreview;
      }
    } catch (error) {
      console.log(error);
    }
    let savedUploader = localStorage.getItem("uploader");
    if (!savedUploader) {
      $uploader = mediaUploader[0];
    } else {
      $uploader = savedUploader;
    }

    const pub = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
    if (pub) {
      console.log(pub);
      signPubkey = pub;
    }
    $nowProgress = false;
  };

  onMount(async () => {
    console.log("onMount");

    setSettings();
    if (paramSharedContent) {
      $additionalPostOptions = {
        tags: tags,
        addableUserList: [],
        defaultUsers: [],
        warningText: undefined,
        content: paramSharedContent,
      };

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
        if (!data.media || data.media.length <= 0) {
          // Svelteのストアに新しいオプションをセット
          $additionalPostOptions = {
            tags: tags,
            addableUserList: [],
            defaultUsers: [],
            warningText: undefined,
            content: sharedContent,
          };

          // ポストウィンドウを開く
          setTimeout(() => {
            $postWindowOpen = true;
          }, 1);
          return;
        }
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
          handleFilesUpload(fileList, sharedContent);
        }
      });
      if (navigator.serviceWorker.controller) {
        // サービスワーカーに最新データをリクエスト
        navigator.serviceWorker.controller.postMessage({
          type: "requestLatestData",
        });
      }
    }
  });

  // // サービスワーカーのメッセージ受信処理
  // onMount(() => {
  //   if (navigator?.serviceWorker) {
  //     navigator.serviceWorker
  //       .register("/service-worker.js")
  //       .then((registration) => {
  //         console.log(
  //           "Service Worker registered with scope:",
  //           registration.scope
  //         );
  //       })
  //       .catch((error) => {
  //         console.error("サービスワーカーの登録に失敗しました:", error);
  //       });

  //     navigator.serviceWorker.ready
  //       .then((registration) => {
  //         console.log("サービスワーカーが準備完了:", registration);

  //         // メッセージリスナーを設定
  //         navigator.serviceWorker.addEventListener("message", (event) => {
  //           console.log("サービスワーカーからのメッセージ:", event.data);

  //           const { title, text, url, media } = event.data;
  //           // メッセージの内容を処理
  //           console.log("Received data:", { title, text, url, media });
  //           fileList = media;
  //           sharedContent = [title, text, url].filter(Boolean).join("\n");

  //           // ファイルアップロードの処理を開始
  //           handleFileUpload(fileList, sharedContent);
  //         });
  //       })
  //       .catch((error) => {
  //         console.error("サービスワーカーの準備に失敗しました:", error);
  //       });
  //   } else {
  //     console.log("サービスワーカーはサポートされていません。");
  //   }
  // });
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
              sharedContent = `\n${url}`;
              // 500ms待機するPromise //image not foundになるのを避けるため
              await delay(2000);
              console.log(sharedContent);
              $nowProgress = false;
            }
          }
        });
      }
      // Svelteのストアに新しいオプションをセット
      $additionalPostOptions = {
        tags: tags,
        addableUserList: [],
        defaultUsers: [],
        warningText: undefined,
        content: sharedContent,
      };

      // ポストウィンドウを開く
      setTimeout(() => {
        $postWindowOpen = true;
      }, 1);
    } catch (error) {
      console.error("ファイルアップロードの処理でエラーが発生しました:", error);
    }
  }
</script>

<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
    {signPubkey}
  />
</div>
