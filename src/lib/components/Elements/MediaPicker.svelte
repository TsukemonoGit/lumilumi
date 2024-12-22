<script lang="ts">
  import { Image } from "lucide-svelte";

  interface Props {
    files?: FileList | undefined;
    fileInput?: HTMLInputElement | undefined;
    [key: string]: any;
    onchange: any;
  }

  let {
    files = $bindable(undefined),
    fileInput = $bindable(undefined),
    onchange,
    ...rest
  }: Props = $props();

  function onButtonClick(): void {
    if (fileInput) fileInput.click();
  }

  function prunedRestProps() {
    delete rest.class;
    return rest;
  }
</script>

<div class="file-button" data-testid="file-button">
  <div class="w-0 h-0 overflow-hidden">
    <input
      type="file"
      bind:this={fileInput}
      bind:files
      {onchange}
      {...prunedRestProps()}
      accept="image/*,video/*,audio/*"
      multiple
    />
  </div>
  <button
    type="button"
    class="file-button-btn inline-flex h-8 items-center justify-center rounded-md border border-magnum-500
      bg-zinc-900 px-4 font-medium leading-none text-zinc-100 align-middle my-auto hover:opacity-75 active:opacity-50"
    disabled={rest.disabled}
    onclick={onButtonClick}
  >
    <Image size="20" class="stroke-magnum-300" />
  </button>
</div>
