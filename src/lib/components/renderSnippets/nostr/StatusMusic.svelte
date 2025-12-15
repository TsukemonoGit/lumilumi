<script lang="ts">
  import { userStatusMap } from "$lib/stores/globalRunes.svelte";
  import type Nostr from "nostr-typedef";

  interface Props {
    pubkey: string;
    loading?: import("svelte").Snippet;
    children?: import("svelte").Snippet<[{ event: Nostr.Event }]>;
  }

  let { pubkey, loading, children }: Props = $props();
  let data: Nostr.Event | undefined = $derived(
    userStatusMap.get(pubkey)?.get("music")
  );
</script>

{#if !data}
  {@render loading?.()}
{:else if data}
  {@render children?.({ event: data })}
{/if}
