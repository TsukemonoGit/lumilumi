<script lang="ts">
  import type Nostr from "nostr-typedef";

  import { userStatusStore } from "$lib/stores/stores";

  interface Props {
    pubkey: string;
    loading?: import("svelte").Snippet;
    children?: import("svelte").Snippet<[any]>;
  }

  let { pubkey, loading, children }: Props = $props();
  let data: Nostr.Event | undefined = $state();

  userStatusStore.subscribe((value) => {
    if (value) {
      data = value.get(pubkey)?.get("music");
    }
  });
</script>

{#if !data}
  {@render loading?.()}
{:else if data}
  {@render children?.({ event: data })}
{/if}
