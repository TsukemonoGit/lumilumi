<script lang="ts">
  import { goto } from "$app/navigation";
  import ListLinkCard from "$lib/components/NostrElements/Note/ListLinkCard.svelte";
  import ListMain from "$lib/components/NostrMainData/ListMain.svelte";
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";

  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";

  const handleClickToList = (event: Nostr.Event) => {
    const dtag = event.tags.find((tag) => tag[0] === "d")?.[1];
    const naddr: nip19.AddressPointer = {
      identifier: dtag ?? "",
      kind: event.kind,
      pubkey: event.pubkey,
    };
    goto(`/list/${nip19.naddrEncode(naddr)}`);
  };
  //10005がない場合はのりすにとばす？
</script>

<section class="container">
  <NostrMain let:pubkey let:localRelays>
    <SetDefaultRelays {pubkey} {localRelays} let:relays let:status>
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>
      <div class="flex flex-col gap-2 w-full overflow-x-hidden">
        <ListMain queryKey={["kind30000", pubkey]} {pubkey} let:events>
          <div slot="loading">loading</div>
          <div slot="error">error</div>
          <div slot="nodata">nodata</div>
          {#each events as event}
            <button
              on:click={() => handleClickToList(event)}
              class="border border-magnum-500 hover:opacity-75 focus:opacity-50 rounded-lg overflow-hidden"
            >
              <ListLinkCard {event} /></button
            >
          {/each}
        </ListMain>
      </div>
    </SetDefaultRelays>
  </NostrMain>
</section>
