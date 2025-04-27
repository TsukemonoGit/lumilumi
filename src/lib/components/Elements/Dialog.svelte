<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import { untrack, type Snippet } from "svelte";

  import { fade } from "svelte/transition";
  import { X } from "lucide-svelte";
  import type { Writable } from "svelte/store";
  import { page } from "$app/state";
  import { pushState } from "$app/navigation";
  import { popStack } from "$lib/stores/stores";

  const {
    elements: {
      trigger,
      overlay,
      content,
      title,
      description,
      close,
      portalled,
    },
    states: { open: dialogOpen },
  } = createDialog({
    forceVisible: true,
  });

  //export { open };
  interface Props {
    dialogTitle?: string | undefined;
    main?: Snippet;
    open?: Writable<boolean>;
    zIndex?: number;
    id: string;
  }

  let {
    open = $bindable(),
    dialogTitle = undefined,
    main,
    zIndex = 10,
    id,
  }: Props = $props();

  // ダイアログを開く際に新しい履歴エントリを作成
  function openDialogWithHistory() {
    pushState("", {
      dialogOpen: {
        id: id,
      },
    });
  }

  open?.subscribe((value: boolean) => {
    // console.log(value);
    if (value) {
      $dialogOpen = true;
      $open = false;
      openDialogWithHistory();
    }
  });

  // Handle back navigation from popStack
  popStack.subscribe((value) => {
    const log = value.find((v) => v.id === id);
    if (log) {
      $dialogOpen = false;
      $open = false;
      popStack.update((stack) => stack.filter((s) => s.id !== id));
    }
  });

  // 外部からのページ状態変更を監視
  $effect(() => {
    const currentDialogState = page.state?.dialogOpen?.id === id;
    if ($dialogOpen && !currentDialogState) {
      untrack(() => {
        $dialogOpen = false;
      });
    }
  });
</script>

{#if $dialogOpen}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class={`fixed inset-0  bg-black/50`}
      style={`z-index:${zIndex}`}
      transition:fade={{ duration: 150 }}
    ></div>
    <div
      class={`fixed left-1/2 top-1/2  max-h-[90vh] w-[calc(min(96vw,720px))] 
            -translate-x-1/2 -translate-y-1/2 rounded-xl bg-neutral-900
            p-2 sm:p-6 shadow-lg overflow-hidden grid grid-rows-[auto_1fr_auto]`}
      style={`z-index:${zIndex}`}
      use:melt={$content}
    >
      <h2 use:melt={$title} class="m-0 text-lg font-medium">
        {dialogTitle || ""}
      </h2>

      {@render main?.()}

      <div class="mt-4 flex justify-end gap-4">
        <button
          use:melt={$close}
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
        >
          Close
        </button>
      </div>

      <button
        use:melt={$close}
        aria-label="close"
        class="absolute right-4 top-4 inline-flex appearance-none
        items-center justify-center rounded-full p-1 text-magnum-800
        hover:bg-magnum-300 focus:shadow-magnum-400 bg-magnum-100"
      >
        <X class="size-6" />
      </button>
    </div>
  </div>
{/if}
