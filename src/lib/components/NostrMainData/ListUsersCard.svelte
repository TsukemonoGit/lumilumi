<script lang="ts">
  //import * as Nostr from "nostr-typedef";
  import UserMenu from "../Elements/UserMenu.svelte";
  import Metadata from "./Metadata.svelte";
  export let pubkeys: string[];
  const depth: number = 0;
</script>

<div class="flex gap-1 flex-wrap">
  {#each pubkeys as pubkey}
    <Metadata queryKey={["metadata", pubkey]} {pubkey} let:metadata>
      <UserMenu
        slot="loading"
        {pubkey}
        metadata={undefined}
        size={24}
        {depth}
      />

      <UserMenu slot="error" {pubkey} metadata={undefined} size={24} {depth} />

      <UserMenu slot="nodata" {pubkey} metadata={undefined} size={24} {depth} />

      <div><UserMenu {pubkey} {metadata} size={24} {depth} /></div>
    </Metadata>
  {/each}
</div>
