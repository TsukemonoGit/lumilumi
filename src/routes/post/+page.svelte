<script lang="ts">
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { convertMetaTags, filesUpload, mediaUploader } from "$lib/func/util";
  import { additionalPostOptions, postWindowOpen } from "$lib/stores/stores";
  import { onMount } from "svelte";

  // Web Share Target API
  //https://developer.mozilla.org/ja/docs/Web/Manifest/share_target
  //マニフェストからのやつ
  // export let data: {
  //   title: string;
  //   text: string;
  //   url: string;
  //   media: string;
  // };

  let fileList: FileList;
  let sharedContent: string = "";
  let tags: string[][] = [];
  // $: fileList = data.media ? createFileList(new File([], data.media)) : null;

  // sharedContent = [data.title, data.text, data.url]
  //   .filter((param) => param !== null)
  //   .join("\n");

  onMount(async () => {
    try {
      // Service Workerからのメッセージを受け取る
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          const { title, text, url, files } = event.data;

          // 受け取ったデータを処理
          console.log("Received data from service worker:", {
            title,
            text,
            url,
            files,
          });
          fileList = files;
          sharedContent = [title, text, url]
            .filter((param) => param !== null)
            .join("\n");
        });

        let uploader = localStorage.getItem("uploader");
        if (!uploader) {
          uploader = mediaUploader[0];
        }

        if (fileList) {
          const url = await filesUpload(fileList, uploader);

          url.map(async (data) => {
            if (data.status === "success") {
              const url = data.nip94_event?.tags.find(
                (tag) => tag[0] === "url"
              )?.[1];

              if (url) {
                // imetaをタグに入れる
                if (data.nip94_event) {
                  tags.push(convertMetaTags(data.nip94_event));
                }
                sharedContent = sharedContent + url;
              }
            }
          });
        }
        $additionalPostOptions = {
          tags: tags,
          addableUserList: [],
          defaultUsers: [],
          warningText: undefined,
          content: sharedContent,
        };
        $postWindowOpen = true;
      }
    } catch (error) {
      console.log(error);
    }
  });

  // // FileをFileListに変換する関数
  // function createFileList(file: File): FileList {
  //   const dataTransfer = new DataTransfer();
  //   dataTransfer.items.add(file);
  //   return dataTransfer.files;
  // }
  // // サーバーから共有データを取得する関数
  // async function getSharedData(): Promise<FormData> {
  //   const response = await fetch("/post", {
  //     method: "POST",
  //   });
  //   const formData = await response.formData();
  //   return formData;
  // }
</script>

<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>
