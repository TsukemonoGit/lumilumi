<script lang="ts">
  import { nip19 } from "nostr-tools";

  import Metadata from "../NostrMainData/Metadata.svelte";
  import { profile } from "$lib/func/util";
  export let pubhex: string;
</script>

<span class="inline-flex"
  >@<Metadata queryKey={["metadata", pubhex]} pubkey={pubhex} let:metadata>
    <span slot="loading" class="text-sm text-neutral-500 inline-flex break-all">
      {nip19.npubEncode(pubhex)}
    </span>
    <span slot="nodata" class="text-sm text-neutral-500 inline-flex break-all">
      {nip19.npubEncode(pubhex)}
    </span>
    <span
      slot="error"
      class="text-sm text-neutral-500 inline-flex break-all"
      let:error
    >
      {nip19.npubEncode(pubhex)}
    </span>
    {profile(metadata)?.name ?? profile(metadata)?.display_name}
  </Metadata></span
>
