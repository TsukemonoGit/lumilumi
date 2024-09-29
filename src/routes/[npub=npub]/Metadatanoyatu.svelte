<script lang="ts">
  import Kind0Note from "$lib/components/NostrElements/Note/Kind0Note.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { nip19 } from "nostr-tools";

  export let pubkey: string;
  export let tieKey: string;
  const getPub = (pubhex: string): string | null => {
    try {
      return nip19.npubEncode(pubhex);
    } catch (error) {
      return null;
    }
  };
  let view = true;

  $: if (pubkey) {
    view = false;
    setTimeout(() => {
      view = true;
    }, 0);
  }
</script>

{#if view}
  <div class=" overflow-hidden">
    <Metadata queryKey={["metadata", pubkey]} {pubkey} let:metadata>
      <div slot="loading" class="w-full">
        {getPub(pubkey)}
      </div>
      <div slot="nodata" class="w-full">
        {getPub(pubkey)}
      </div>
      <div slot="error" class="w-full">
        {getPub(pubkey)}
      </div>
      <Kind0Note
        note={metadata}
        displayMenu={true}
        proxy={metadata.tags.find((tag) => tag[0] === "proxy")}
        depth={0}
        repostable={true}
        {tieKey}
      />
    </Metadata>
  </div>
{/if}
