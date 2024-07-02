<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import UserMenu from "../Elements/UserMenu.svelte";
  import Metadata from "./Metadata.svelte";
  export let pubkeys: string[];
</script>

<div class="flex gap-1 flex-wrap">
  {#each pubkeys as pubkey}
    <Metadata queryKey={["metadata", pubkey]} {pubkey} let:metadata>
      <UserMenu slot="loading" {pubkey} metadata={undefined} size={24} />

      <UserMenu slot="error" {pubkey} metadata={undefined} size={24} />

      <UserMenu slot="nodata" {pubkey} metadata={undefined} size={24} />

      <div><UserMenu {pubkey} {metadata} size={24} /></div>
    </Metadata>
  {/each}
</div>
