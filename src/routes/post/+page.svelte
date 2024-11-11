<script lang="ts">
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { convertMetaTags, filesUpload, mediaUploader } from "$lib/func/util";
  import { additionalPostOptions, postWindowOpen } from "$lib/stores/stores";
  import { onMount } from "svelte";

  let fileList: FileList;

  let tags: string[][] = [];
  export let data;
  console.log(data);
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
  onMount(() => {
    handleFileUpload(
      data.data.media,
      [data.data.title, data.data.text, data.data.url]
        .filter(Boolean)
        .join("\n")
    );
  });
  async function handleFileUpload(
    files: FileList | null,
    initialContent: string
  ) {
    let sharedContent: string = initialContent;
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
              sharedContent = `${initialContent}\n${url}`;
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
