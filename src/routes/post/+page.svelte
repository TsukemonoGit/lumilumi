<script lang="ts">
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import {
    convertMetaTags,
    delay,
    filesUpload,
    mediaUploader,
  } from "$lib/func/util";
  import { additionalPostOptions, postWindowOpen } from "$lib/stores/stores";
  import { onMount } from "svelte";

  let fileList: FileList;
  let cachedMediaFiles: { name: string; blob: Blob }[] = [];
  let tags: string[][] = [];
  // export let data: {
  //   title: string;
  //   text: string;
  //   url?: string;
  //   media?: string[];
  // };
  let sharedContent: string; // = [data.title, data.text, data.url]
  //   .filter(Boolean)
  //   .join("\n");
  // $: console.log(data);
  onMount(async () => {
    console.log("onMount");
    if (navigator.serviceWorker) {
      console.log("serviceWorker");
      // メッセージを受け取るリスナーを設定
      navigator.serviceWorker.addEventListener("message", async (event) => {
        console.log("message", event);
        const data = event.data;
        if (!data) return;
        sharedContent = [data.title, data.text, data.url]
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
          $postWindowOpen = true;
          return;
        }
        if (data.media) {
          console.log(data.media);
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
          console.log(files);
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
    console.log("onMount");
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
      let uploader = localStorage.getItem("uploader");
      if (!uploader) {
        uploader = mediaUploader[0];
      }
      if (files) {
        // ファイルアップロード
        const urlResults = await filesUpload(files, uploader);

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
              await delay(1000);
              console.log(sharedContent);
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
      $postWindowOpen = true;
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
  />
</div>
