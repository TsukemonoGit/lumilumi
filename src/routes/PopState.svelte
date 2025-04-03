<script lang="ts">
  import { popStack, type Popstate } from "$lib/stores/stores";

  const handlePopstate = (e: PopStateEvent) => {
    const dialog =
      e.state?.["sveltekit:states"]?.dialogOpen || e.state?.dialogOpen;
    // const dialog: Popstate = e.state?.dialogOpen;

    if (dialog) {
      popStack.update((stack) => [...stack, dialog]);
    }
    console.log($popStack);
  };
</script>

<svelte:window onpopstate={handlePopstate} />
