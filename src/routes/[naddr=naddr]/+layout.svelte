<script lang="ts">
  import { page } from "$app/stores";
  import { eventKinds } from "$lib/func/kinds";
  import { nip19 } from "nostr-tools";
  const { type, data } = nip19.decode($page.params.naddr) as {
    type: "naddr" | "nprofile" | "nevent" | "nsec" | "npub" | "note";
    data: nip19.AddressPointer;
  };
</script>

<svelte:head>
  <meta
    name="description"
    content="{eventKinds.get(data.kind)?.en ??
      `kind:${data.kind}`}  ID:{data.identifier}
{data.pubkey ? `pubkey:${nip19.npubEncode(data.pubkey)}` : ''}"
  />

  <meta
    property="og:description"
    content="{eventKinds.get(data.kind)?.en ??
      `kind:${data.kind}`}  ID:{data.identifier}
{data.pubkey ? `pubkey:${nip19.npubEncode(data.pubkey)}` : ''}"
  />
</svelte:head>
<slot />
