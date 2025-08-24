<script lang="ts">
  import EmptyCard from "$lib/components/NostrElements/kindEvents/EventCard/EmptyCard.svelte";
  import Kind0Note from "$lib/components/NostrElements/kindEvents/EventCard/Kind0Note.svelte";
  import FollowButton from "$lib/components/NostrElements/user/FollowButton.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { followList } from "$lib/stores/globalRunes.svelte";
  import * as nip19 from "nostr-tools/nip19";

  interface Props {
    pubkey: string;
  }

  let { pubkey }: Props = $props();

  const encodedPub = $derived.by(() => {
    try {
      if (pubkey) {
        return nip19.npubEncode(pubkey);
      }
    } catch (error) {
      console.error("NIP-19 encoding failed:", error);
    }
    return undefined;
  });

  const petname = $derived(followList.get().get(pubkey));
  const cardName = $derived(petname ? `📛${petname}` : undefined);
</script>

<div class="w-full overflow-hidden">
  <Metadata queryKey={["metadata", pubkey]} {pubkey}>
    {#snippet loading()}
      <EmptyCard nevent={encodedPub} name={cardName}>
        <div class="ml-auto">
          <FollowButton {pubkey} />
        </div>
        loading {encodedPub}
      </EmptyCard>
    {/snippet}

    {#snippet nodata()}
      <EmptyCard pulse={false} nevent={encodedPub} name={cardName} menu={false}
        ><div class="float-end">
          <FollowButton {pubkey} />
        </div>
        not found {encodedPub}
      </EmptyCard>
    {/snippet}

    {#snippet error()}
      <EmptyCard pulse={false} nevent={encodedPub} name={cardName} menu={false}>
        <div class="float-end">
          <FollowButton {pubkey} />
        </div>
        not found {encodedPub}
      </EmptyCard>
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
