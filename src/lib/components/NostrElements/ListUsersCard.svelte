<script lang="ts">
  import Metadata from "../renderSnippets/nostr/Metadata.svelte";
  import UserPopupMenu from "./user/UserPopupMenu.svelte";
  interface Props {
    pubkeys: string[];
  }

  let { pubkeys }: Props = $props();
  const depth: number = 0;
</script>

<div class="flex gap-1 flex-wrap">
  {#each pubkeys as pubkey}
    <Metadata queryKey={["metadata", pubkey]} {pubkey}>
      {#snippet loading()}
        <UserPopupMenu {pubkey} metadata={undefined} size={24} {depth} />
      {/snippet}

      {#snippet error()}
        <UserPopupMenu {pubkey} metadata={undefined} size={24} {depth} />
      {/snippet}

      {#snippet nodata()}
        <UserPopupMenu {pubkey} metadata={undefined} size={24} {depth} />
      {/snippet}

      {#snippet content({ metadata })}
        <div>
          <UserPopupMenu {pubkey} {metadata} size={24} {depth} />
        </div>
      {/snippet}
    </Metadata>
  {/each}
</div>
