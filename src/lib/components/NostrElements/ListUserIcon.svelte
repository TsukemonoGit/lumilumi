<script lang="ts">
  import { X } from "lucide-svelte";
  import Metadata from "../renderSnippets/nostr/Metadata.svelte";
  import UserPopupMenu from "./user/UserPopupMenu.svelte";
  import IconButton from "../Elements/IconButton.svelte";

  interface Props {
    pubkey: string;
    onDelete?: () => void;
    deleteMode: boolean;
  }

  let { pubkey, onDelete, deleteMode }: Props = $props();
  const depth: number = 0;
</script>

<div class="relative">
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

  {#if deleteMode}
    <IconButton
      className="absolute  -top-2 -right-2"
      size={12}
      variant="ghost"
      onclick={() => onDelete?.()}
      title="delete user"><X /></IconButton
    >
  {/if}
</div>
