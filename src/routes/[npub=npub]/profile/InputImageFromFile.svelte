<script lang="ts">
  import MediaPicker from "$lib/components/Elements/MediaPicker.svelte";
  import UploaderSelect from "$lib/components/Elements/UploaderSelect.svelte";
  import type { FileUploadResponse } from "$lib/func/nip96";
  import { filesUpload } from "$lib/func/upload";
  import { uploader } from "$lib/stores/globalRunes.svelte";

  import { nowProgress } from "$lib/stores/stores";

  interface Props {
    inputText: string | undefined;
  }

  let { inputText = $bindable() }: Props = $props();

  let files: FileList | undefined = $state();
  let fileInput: HTMLInputElement | undefined = $state();

  // アップロードキャンセル用のコントローラーを作成
  let uploadAbortController: AbortController | null = null;

  const onChangeHandler = async (e: Event): Promise<void> => {
    const _files = (e.target as HTMLInputElement).files;
    if (_files) {
      await handleFileUpload(_files);
    }
  };

  const handleFileUpload = async (fileList: FileList) => {
    if (!fileList || fileList.length <= 0 || !uploader) return;
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
        uploader,
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

<div class="flex w-60 max-w-full gap-1">
  <UploaderSelect /><MediaPicker
    bind:files
    bind:fileInput
    onchange={onChangeHandler}
  />
</div>
