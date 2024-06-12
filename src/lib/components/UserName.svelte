<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { nip19 } from "nostr-tools";
  import Metadata from "./NostrMainData/Metadata.svelte";
  import type { Profile } from "$lib/types";
  export let pubhex: string;

  const profile = (ev: Nostr.Event): Profile | undefined => {
    try {
      return JSON.parse(ev.content);
    } catch (error) {
      return undefined;
    }
  };
</script>

@<Metadata queryKey={["metadata", pubhex]} pubkey={pubhex} let:metadata>
  <div slot="loading">{nip19.npubEncode(pubhex)}</div>
  <div slot="nodata">
    {nip19.npubEncode(pubhex)}
  </div>
  <div slot="error" let:error>
    {nip19.npubEncode(pubhex)}
  </div>
  {profile(metadata)?.name ?? profile(metadata)?.display_name}
</Metadata>
