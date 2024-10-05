<script lang="ts">
  import { Image } from "lucide-svelte";

  export let files: FileList | undefined = undefined;

  export let fileInput: HTMLInputElement | undefined = undefined;

  function onButtonClick(): void {
    if (fileInput) fileInput.click();
  }

  function prunedRestProps() {
    delete $$restProps.class;
    return $$restProps;
  }
</script>

<div class="file-button" data-testid="file-button">
  <div class="w-0 h-0 overflow-hidden">
    <input
      type="file"
      bind:this={fileInput}
      bind:files
      {...prunedRestProps()}
      on:change
      accept="image/*,video/*,audio/*"
      multiple
    />
  </div>
  <button
    type="button"
    class="file-button-btn inline-flex h-8 items-center justify-center rounded-sm border border-magnum-300
      bg-zinc-900 px-4 font-medium leading-none text-zinc-100 align-middle my-auto hover:opacity-75 active:opacity-50"
    disabled={$$restProps.disabled}
    on:click={onButtonClick}
    on:keydown
    on:keyup
    on:keypress
  >
    <Image size="20" class="stroke-magnum-300" />
  </button>
</div>
