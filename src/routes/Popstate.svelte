<script lang="ts">
  import { popStack } from "$lib/stores/stores";

  const handlePopstate = (e: PopStateEvent) => {
    //console.log("e", e, "pa", page.state?.dialogOpen?.id);
    console.log("popStack", $popStack);
    const dialog =
      e.state?.["sveltekit:states"]?.dialogOpen || e.state?.dialogOpen;
    // const dialog: Popstate = e.state?.dialogOpen;
    if (dialog) {
      popStack.update((stack) => [...stack, dialog]);
    }
    console.log("popStack", $popStack);
  };
</script>

<svelte:window onpopstate={handlePopstate} />
