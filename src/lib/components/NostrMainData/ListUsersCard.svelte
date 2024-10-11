<script lang="ts">
  //import * as Nostr from "nostr-typedef";
  import UserMenu from "../Elements/UserPopupMenu.svelte";
  import Metadata from "./Metadata.svelte";
  export let pubkeys: string[];
  export let tieKey;
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
        {tieKey}
      />

      <UserMenu
        slot="error"
        {pubkey}
        metadata={undefined}
        size={24}
        {depth}
        {tieKey}
      />

      <UserMenu
        slot="nodata"
        {pubkey}
        metadata={undefined}
        size={24}
        {depth}
        {tieKey}
      />

      <div><UserMenu {pubkey} {metadata} size={24} {depth} {tieKey} /></div>
    </Metadata>
  {/each}
</div>
