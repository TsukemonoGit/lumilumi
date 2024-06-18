<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { nip19 } from "nostr-tools";

  import type { Profile } from "$lib/types";
  import Metadata from "../NostrMainData/Metadata.svelte";
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
  <div slot="loading" class="text-sm text-neutral-500 flex-inline break-all">
    {nip19.npubEncode(pubhex)}
  </div>
  <div slot="nodata" class="text-sm text-neutral-500 flex-inline break-all">
    {nip19.npubEncode(pubhex)}
  </div>
  <div
    slot="error"
    class="text-sm text-neutral-500 flex-inline break-all"
    let:error
  >
    {nip19.npubEncode(pubhex)}
  </div>
  {profile(metadata)?.name ?? profile(metadata)?.display_name}
</Metadata>
