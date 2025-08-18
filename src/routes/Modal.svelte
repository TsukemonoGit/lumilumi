<script lang="ts">
  import { modalState, type ModalState } from "$lib/stores/stores";
  import { onDestroy } from "svelte";

  import { createDialog, melt } from "@melt-ui/svelte";
  import { untrack } from "svelte";

  import { fade } from "svelte/transition";
  import { X } from "lucide-svelte";
  import { page } from "$app/state";
  import { pushState } from "$app/navigation";
  import { popStack } from "$lib/stores/stores";
  import CloseButton from "$lib/components/Elements/CloseButton.svelte";

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
  const id = "modal";
  // ダイアログを開く際に新しい履歴エントリを作成
  function openDialogWithHistory() {
    pushState("", {
      dialogOpen: {
        id: id,
      },
    });
  }

  // ブラウザバックなどでpopStackからナビゲーション変更があった場合
  $effect(() => {
    const logEntry = $popStack?.[0]?.id === id;

    if (logEntry) {
      untrack(() => {
        $dialogOpen = false;

        popStack.update((stack) => stack.filter((entry) => entry.id !== id));
      });
    }
  });

  $effect(() => {
    const currentDialogState = page.state?.dialogOpen?.id === id;
    if ($dialogOpen && !currentDialogState) {
      untrack(() => {
        $dialogOpen = false;
        popStack.update((stack) => stack.filter((entry) => entry.id !== id));
      });
    }
  });

  let modal: ModalState | null = $state(null);
  let unsubscribe = modalState.subscribe((state) => {
    if (state.isOpen) {
      modal = state;
      $dialogOpen = true;
      openDialogWithHistory();
    } else {
      modal = null;
      $dialogOpen = false;
    }
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

{#if $dialogOpen && modal}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class={`fixed inset-0  bg-black/50`}
      style={`z-index:9999`}
      transition:fade={{ duration: 150 }}
    ></div>
    <div
      class={`fixed left-1/2 top-1/2  max-h-[90vh] w-[calc(min(96vw,720px))] 
              -translate-x-1/2 -translate-y-1/2 rounded-xl bg-neutral-900
              p-2 sm:p-6 shadow-lg overflow-hidden grid grid-rows-[auto_1fr_auto]`}
      style={`z-index:9999`}
      use:melt={$content}
    >
      <modal.component {...modal.props} />

      <CloseButton useMelt={$close} ariaLabel="close" />
    </div>
  </div>
{/if}
