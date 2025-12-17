<!--Dialog.svelte-->
<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import { untrack, type Snippet } from "svelte";
  import { fade } from "svelte/transition";
  import { X } from "lucide-svelte";
  import type { Writable } from "svelte/store";
  import { pushState } from "$app/navigation";
  import { popStack } from "$lib/stores/stores";
  import CloseButton from "./CloseButton.svelte";

  interface Props {
    dialogTitle?: string;
    main?: Snippet;
    open?: Writable<boolean>;
    zIndex?: number;
    id: string;
    closeOnOutsideClick?: boolean;
  }

  let {
    open = $bindable(),
    dialogTitle = "",
    main,
    zIndex = 10,
    id,
    closeOnOutsideClick = true,
  }: Props = $props();

  let scrollContainer: HTMLDivElement | null = $state(null);

  const {
    elements: { overlay, content, title, close, portalled },
    states: { open: dialogOpen },
  } = createDialog({
    forceVisible: true,
    //svelte-ignore state_referenced_locally
    closeOnOutsideClick: closeOnOutsideClick,
  });

  const resetScrollPosition = () => {
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  };

  const openDialog = () => {
    $dialogOpen = true;
    pushState("", { dialogOpen: { id } });
  };

  const closeDialog = () => {
    $dialogOpen = false;
    popStack.update((stack) => stack.filter((entry) => entry.id !== id));
  };

  // ダイアログ開放時のスクロール位置リセット
  $effect(() => {
    if ($dialogOpen && scrollContainer) {
      setTimeout(resetScrollPosition, 0);
    }
  });

  // 外部からのダイアログ制御
  $effect(() => {
    if (!open) return;

    return open.subscribe((value) => {
      value ? openDialog() : closeDialog();
    });
  });

  // ブラウザバック処理
  $effect(() => {
    const isCurrentDialog = $popStack?.[0]?.id === id;
    if (isCurrentDialog) {
      untrack(() => ($dialogOpen = false));
    }
  });

  // ダイアログ状態の同期
  $effect(() => {
    return dialogOpen.subscribe((value) => {
      if (!value && open) {
        $open = false;
      }
    });
  });
</script>

{#if $dialogOpen}
  <div use:melt={$portalled}>
    <!-- オーバーレイ -->
    <div
      use:melt={$overlay}
      class="fixed inset-0 bg-black/50"
      style:z-index={zIndex}
      transition:fade={{ duration: 150 }}
    ></div>

    <!-- ダイアログコンテンツ -->
    <div
      use:melt={$content}
      class="fixed left-1/2 top-1/2 max-h-[90vh] w-[calc(min(96vw,720px))]
             -translate-x-1/2 -translate-y-1/2 rounded-xl bg-neutral-900
             p-2 sm:p-6 shadow-lg overflow-hidden flex flex-col"
      style:z-index={zIndex}
    >
      <!-- ヘッダー -->
      <h2 use:melt={$title} class="m-0 text-lg font-medium">
        {dialogTitle}
      </h2>

      <!-- メインコンテンツ -->
      <div class="flex-1 overflow-auto" bind:this={scrollContainer}>
        {@render main?.()}
      </div>

      <!-- フッター -->
      <div class="mt-4 flex justify-end gap-4">
        <button
          use:melt={$close}
          class="inline-flex h-8 items-center justify-center rounded-sm
                 bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
        >
          Close
        </button>
      </div>

      <!-- 閉じるボタン --><CloseButton
        useMelt={$close}
        zIndex={zIndex + 1}
        ariaLabel="close"
      />
    </div>
  </div>
{/if}
