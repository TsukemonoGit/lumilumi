<script lang="ts">
  //import * as Nostr from "nostr-typedef";
  import UserMenu from "../Elements/UserPopupMenu.svelte";
  import Metadata from "./Metadata.svelte";
  interface Props {
    pubkeys: string[];
    tieKey: any;
  }

  let { pubkeys, tieKey }: Props = $props();
  const depth: number = 0;
</script>

<div class="flex gap-1 flex-wrap">
  {#each pubkeys as pubkey}
    <Metadata queryKey={["metadata", pubkey]} {pubkey}>
      {#snippet loading()}
        <UserMenu {pubkey} metadata={undefined} size={24} {depth} {tieKey} />
      {/snippet}

      {#snippet error()}
        <UserMenu {pubkey} metadata={undefined} size={24} {depth} {tieKey} />
      {/snippet}

      {#snippet nodata()}
        <UserMenu {pubkey} metadata={undefined} size={24} {depth} {tieKey} />
      {/snippet}

      {#snippet content({ metadata })}
        <div><UserMenu {pubkey} {metadata} size={24} {depth} {tieKey} /></div>
      {/snippet}
    </Metadata>
  {/each}
</div>
