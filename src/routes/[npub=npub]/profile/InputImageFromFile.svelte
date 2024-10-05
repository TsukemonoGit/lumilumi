<script lang="ts">
  import MediaPicker from "$lib/components/Elements/MediaPicker.svelte";
  import UploaderSelect from "$lib/components/Elements/UploaderSelect.svelte";
  import { filesUpload } from "$lib/func/util";
  import { nowProgress, uploader } from "$lib/stores/stores";
  import type { FileUploadResponse } from "nostr-tools/nip96";

  export let inputText: string | undefined;

  let selectedUploader: string;
  let files: FileList | undefined;
  let fileInput: HTMLInputElement | undefined;
  $: if (selectedUploader) {
    $uploader = selectedUploader;
  }
  // アップロードキャンセル用のコントローラーを作成
  let uploadAbortController: AbortController | null = null;

  const onChangeHandler = async (e: Event): Promise<void> => {
    const _files = (e.target as HTMLInputElement).files;
    if (_files) {
      await handleFileUpload(_files);
    }
  };

  const handleFileUpload = async (fileList: FileList) => {
    if (!fileList || fileList.length <= 0 || !$uploader) return;
    $nowProgress = true;

    // 既存のアップロードがある場合はキャンセルする
    if (uploadAbortController) {
      uploadAbortController.abort();
    }

    // 新しいアップロード用のAbortControllerを作成
    uploadAbortController = new AbortController();

    try {
      const uploadedURPs: FileUploadResponse[] = await filesUpload(
        fileList,
        $uploader,
        uploadAbortController.signal // アップロード中断のシグナルを渡す
      );

      console.log(uploadedURPs);

      // 一つしか入れないので
      const data = uploadedURPs[0];

      if (data.status === "success") {
        const url = data.nip94_event?.tags.find((tag) => tag[0] === "url")?.[1];

        if (url) {
          inputText = url;
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      // 非同期処理がすべて完了した後に実行
      $nowProgress = false;
      uploadAbortController = null;
    }
  };
</script>

<div class="flex w-fit gap-1">
  <UploaderSelect
    bind:defaultValue={$uploader}
    bind:selectedUploader
  /><MediaPicker bind:files bind:fileInput on:change={onChangeHandler} />
</div>
