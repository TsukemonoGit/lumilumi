<script lang="ts">
  import { modalState, type ModalState } from "$lib/stores/stores";
  import { onDestroy } from "svelte";
  import Dialog from "$lib/components/Elements/Dialog.svelte";

  const id = "modal";
  let dialogOpen = $state(false);

  let modal: ModalState | null = $state(null);
  let unsubscribe = modalState.subscribe((state) => {
    if (state.isOpen) {
      modal = state;
      dialogOpen = true;
    } else {
      modal = null;
      dialogOpen = false;
    }
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

{#if modal}
  {@const Component = modal.component}
  {@const props = modal.props}
  <Dialog
    bind:open={dialogOpen}
    {id}
    zIndex={9999}
    contentClass="grid grid-rows-[auto_1fr_auto]"
  >
    {#snippet main()}
      <Component {...props}></Component>
    {/snippet}
  </Dialog>
{/if}
