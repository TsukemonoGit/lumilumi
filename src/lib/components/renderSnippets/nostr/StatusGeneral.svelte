<script lang="ts">
  import { userStatusMap } from "$lib/stores/globalRunes.svelte";
  import type Nostr from "nostr-typedef";
  import type { Snippet } from "svelte";

  interface Props {
    pubkey: string;
    loading?: Snippet;
    children?: Snippet<[{ event: Nostr.Event }]>;
  }

  let { pubkey, loading, children }: Props = $props();
  let data: Nostr.Event | undefined = $derived(
    userStatusMap.get(pubkey)?.get("general")
  );
</script>

{#if !data}
  {@render loading?.()}
{:else if data}
  {@render children?.({ event: data })}
{/if}
