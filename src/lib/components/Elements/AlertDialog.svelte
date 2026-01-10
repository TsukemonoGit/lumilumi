<!--AlertDialog.svelte-->
<script lang="ts">
  import { type Snippet } from "svelte";
  import Dialog from "./Dialog.svelte";

  interface Props {
    onClickOK: () => void;
    title?: string;
    description?: string;
    okButtonName?: string;
    main?: Snippet;
    open?: boolean;
    closeOnOutsideClick?: boolean;
    id: string;
  }

  let {
    onClickOK,
    title = "",
    description = "",
    okButtonName = "Continue",
    main: contentSnippet,
    open = $bindable(false),
    closeOnOutsideClick = true,
    id,
  }: Props = $props();
</script>

<Dialog bind:open dialogTitle={title} {id} {closeOnOutsideClick} zIndex={50}>
  {#snippet main()}
    {#if description}
      <p class="mb-5 mt-2 leading-normal text-zinc-400">
        {description}
      </p>
    {/if}

    <div class="mb-4 text-zinc-200">
      {@render contentSnippet?.()}
    </div>
  {/snippet}

  {#snippet footer({ close })}
    <div class="mt-4 flex justify-end gap-4">
      <button
        onclick={() => (open = false)}
        class="inline-flex h-8 items-center justify-center rounded-[4px]
               bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
      >
        Cancel
      </button>
      <button
        class="inline-flex h-8 items-center justify-center rounded-[4px]
               bg-magnum-100 px-4 font-medium leading-none text-magnum-900"
        onclick={onClickOK}
      >
        {okButtonName}
      </button>
    </div>
  {/snippet}
</Dialog>
