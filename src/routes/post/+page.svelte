<script lang="ts">
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { convertMetaTags, filesUpload, mediaUploader } from "$lib/func/util";
  import { additionalPostOptions, postWindowOpen } from "$lib/stores/stores";
  import { onMount } from "svelte";

  export let data: {
    title: string;
    text: string;
    url: string;
    media: string;
  };

  let sharedContent: string = "";
  let tags: string[][] = [];
  let fileList = data.media ? createFileList(new File([], data.media)) : null;

  sharedContent = [data.title, data.text, data.url]
    .filter((param) => param !== null)
    .join("\n");

  onMount(async () => {
    console.log(data);
    try {
      let uploader = localStorage.getItem("uploader") || mediaUploader[0];

      if (fileList) {
        const url = await filesUpload(fileList, uploader);

        url.map(async (data) => {
          if (data.status === "success") {
            const url = data.nip94_event?.tags.find(
              (tag) => tag[0] === "url"
            )?.[1];

            if (url) {
              if (data.nip94_event) {
                tags.push(convertMetaTags(data.nip94_event));
              }
              sharedContent += url;
            }
          }
        });
      }

      $additionalPostOptions = {
        tags,
        addableUserList: [],
        defaultUsers: [],
        warningText: undefined,
        content: sharedContent,
      };
      $postWindowOpen = true;
    } catch (error) {
      console.error(error);
    }
  });

  function createFileList(file: File): FileList {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    return dataTransfer.files;
  }
</script>

// src/routes/post/+page.svelte
<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>
