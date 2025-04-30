<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import { untrack, type Snippet } from "svelte";
  import { fade } from "svelte/transition";
  import { X } from "lucide-svelte";
  import type { Writable } from "svelte/store";
  import { pushState } from "$app/navigation";
  import { popStack } from "$lib/stores/stores";
  import { page } from "$app/state";

  interface Props {
    dialogTitle?: string;
    main?: Snippet;
    open?: Writable<boolean>;
    zIndex?: number;
    id: string;
  }

  let {
    open = $bindable(),
    dialogTitle = "",
    main,
    zIndex = 10,
    id,
  }: Props = $props();

  const {
    elements: { overlay, content, title, close, portalled },
    states: { open: dialogOpen },
  } = createDialog({
    forceVisible: true,
  });

  // ダイアログを開く際に新しい履歴エントリを作成
  function openDialogWithHistory() {
    pushState("", {
      dialogOpen: {
        id: id,
      },
    });
  }

  // 外部からダイアログを開く要求があった場合の処理

  open?.subscribe((value) => {
    if (value) {
      $dialogOpen = true;
      $open = false;
      openDialogWithHistory();
    }
  });

  // ブラウザバックなどでpopStackからナビゲーション変更があった場合
  $effect(() => {
    const logEntry = $popStack?.[0]?.id === id;

    if (logEntry) {
      untrack(() => {
        $dialogOpen = false;
        $open = false;
        popStack.update((stack) => stack.filter((entry) => entry.id !== id));
      });
    }
  });

  /*   // 外部からのページ状態変更を監視
  $effect(() => {
    const currentDialogState = page.state?.dialogOpen?.id === id;
    if ($dialogOpen && !currentDialogState) {
      untrack(() => {
        $dialogOpen = false;
      });
    }
  });  */
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
             p-2 sm:p-6 shadow-lg overflow-hidden grid grid-rows-[auto_1fr_auto]"
      style:z-index={zIndex}
    >
      <!-- ヘッダー -->
      <h2 use:melt={$title} class="m-0 text-lg font-medium">
        {dialogTitle}
      </h2>

      <!-- メインコンテンツ -->
      {@render main?.()}

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

      <!-- 閉じるボタン -->
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
