<script lang="ts">
  import { nip19 } from "nostr-tools";

  import Metadata from "../NostrMainData/Metadata.svelte";
  import { profile } from "$lib/func/util";
  export let pubhex: string;
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
