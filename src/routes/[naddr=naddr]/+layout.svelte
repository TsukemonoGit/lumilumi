<script lang="ts">
  import { eventKinds } from "$lib/func/kinds";
  import { nip19 } from "nostr-tools";
  export let data: {
    identifier: string;
    pubkey: string;
    kind: number;
    relays?: string[] | undefined;
  };
</script>

<svelte:head>
  <meta
    name="description"
    content="{eventKinds.get(data.kind)?.en ??
      `kind:${data.kind}`}  ID:{data.identifier}
pubkey:{nip19.npubEncode(data.pubkey)}"
  />

  <meta
    property="og:description"
    content="{eventKinds.get(data.kind)?.en ??
      `kind:${data.kind}`}  ID:{data.identifier}
pubkey:{nip19.npubEncode(data.pubkey)}"
  />
</svelte:head>
