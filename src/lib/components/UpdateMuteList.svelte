<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { getDoukiList, getQueryRelays } from "$lib/func/settings";

  export let pubkey: string;
  async function handleClickMute() {
    try {
      const gotPubkey = await (
        window.nostr as Nostr.Nip07.Nostr
      ).getPublicKey();
      if (gotPubkey) {
        pubkey = gotPubkey;
      }
    } catch (error) {
      console.log(error);
    }
    if (pubkey === "") {
      return;
    }
    const relays = await getQueryRelays(pubkey);
    console.log(relays);
    if (!relays) {
      return;
    }
    const filters: Nostr.Filter[] = [
      { limit: 1, kinds: [10000], authors: [pubkey] },
    ];
    const event = await getDoukiList(filters, relays);
    console.log(event);
  }
</script>

<button
  class="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
  on:click={handleClickMute}>Mute</button
><span class="ml-2">最終更新日時：mada</span>
