<script lang="ts">
  import EmptyCard from "$lib/components/NostrElements/kindEvents/EventCard/EmptyCard.svelte";
  import Kind0Note from "$lib/components/NostrElements/kindEvents/EventCard/Kind0Note.svelte";

  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { nip19 } from "nostr-tools";

  interface Props {
    pubkey: string;
  }

  let { pubkey }: Props = $props();
  let encodedPub: string | undefined = $derived.by(() => {
    if (!pubkey) return undefined;
    try {
      return nip19.npubEncode(pubkey);
    } catch (error) {
      return undefined;
    }
  });
</script>

<div class="w-full overflow-hidden">
  <Metadata queryKey={["metadata", pubkey]} {pubkey}>
    {#snippet loading()}<EmptyCard nevent={encodedPub}
        >loading {encodedPub}</EmptyCard
      >
    {/snippet}
    {#snippet nodata()}
      <EmptyCard nevent={encodedPub}>not found {encodedPub}</EmptyCard>
    {/snippet}
    {#snippet error()}
      <EmptyCard nevent={encodedPub}>not found {encodedPub}</EmptyCard>
    {/snippet}
    {#snippet content({ metadata })}
      <Kind0Note
        note={metadata}
        displayMenu={true}
        depth={0}
        repostable={true}
      />
    {/snippet}
  </Metadata>
</div>
