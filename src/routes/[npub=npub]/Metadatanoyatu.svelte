<script lang="ts">
  import { run } from "svelte/legacy";

  import Kind0Note from "$lib/components/NostrElements/Note/EventCard/Kind0Note.svelte";

  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { nip19 } from "nostr-tools";

  interface Props {
    pubkey: string;
    tieKey: string;
  }

  let { pubkey, tieKey }: Props = $props();
  const getPub = (pubhex: string): string | null => {
    try {
      return nip19.npubEncode(pubhex);
    } catch (error) {
      return null;
    }
  };
  let view = $state(true);

  run(() => {
    if (pubkey) {
      view = false;
      setTimeout(() => {
        view = true;
      }, 0);
    }
  });
</script>

{#if view}
  <div class=" overflow-hidden">
    <Metadata queryKey={["metadata", pubkey]} {pubkey}>
      {#snippet loading()}
        <div class="w-full">
          {getPub(pubkey)}
        </div>
      {/snippet}
      {#snippet nodata()}
        <div class="w-full">
          {getPub(pubkey)}
        </div>
      {/snippet}
      {#snippet error()}
        <div class="w-full">
          {getPub(pubkey)}
        </div>
      {/snippet}
      {#snippet content({ metadata })}
        <Kind0Note
          note={metadata}
          displayMenu={true}
          depth={0}
          repostable={true}
          {tieKey}
        />
      {/snippet}
    </Metadata>
  </div>
{/if}
