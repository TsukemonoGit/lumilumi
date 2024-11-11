<script lang="ts">
  import { page } from "$app/stores";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { convertMetaTags, filesUpload, mediaUploader } from "$lib/func/util";
  import { additionalPostOptions, postWindowOpen } from "$lib/stores/stores";
  import { onMount } from "svelte";

  // Web Share Target API
  //https://developer.mozilla.org/ja/docs/Web/Manifest/share_target
  //マニフェストからのやつ

  const title = $page.url.searchParams.get("title");
  const text = $page.url.searchParams.get("text");
  const url = $page.url.searchParams.get("url");
  let sharedContent = [title, text, url]

    .filter((param) => param !== null)
    .join("\n");
  let tags: string[][] = [];

  onMount(async () => {
    try {
      let uploader = localStorage.getItem("uploader");
      if (!uploader) {
        uploader = mediaUploader[0];
      }

      // サーバーから共有データを取得する
      const formData = await getSharedData();
      const sharedImage = formData.get("image") as File | null;
      if (sharedImage) {
        const fileList = createFileList(sharedImage);
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
    } catch (error) {
      console.log(error);
    }
  });

  // FileをFileListに変換する関数
  function createFileList(file: File): FileList {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    return dataTransfer.files;
  }
  // サーバーから共有データを取得する関数
  async function getSharedData(): Promise<FormData> {
    const response = await fetch("/post", {
      method: "POST",
    });
    const formData = await response.formData();
    return formData;
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
