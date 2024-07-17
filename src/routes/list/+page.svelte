<script lang="ts">
  import { goto } from "$app/navigation";
  import Link from "$lib/components/Elements/Link.svelte";
  import ListLinkCard from "$lib/components/NostrElements/Note/ListLinkCard.svelte";
  import ListMain from "$lib/components/NostrMainData/ListMain.svelte";
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  import { _ } from "svelte-i18n";

  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  import { SquareArrowOutUpRight } from "lucide-svelte";
  import { loginUser } from "$lib/stores/stores";

  const handleClickToList = (event: Nostr.Event) => {
    const dtag = event.tags.find((tag) => tag[0] === "d")?.[1];
    const naddr: nip19.AddressPointer = {
      identifier: dtag ?? "",
      kind: event.kind,
      pubkey: event.pubkey,
    };
    goto(`/list/${nip19.naddrEncode(naddr)}`);
  };

  const filtered = (events: Nostr.Event[]) => {
    return events.filter((event) => event.tags.find((item) => item[0] === "p"));
  };
</script>

<svelte:head>
  <title>Lumilumi-List</title>
  <meta name="description" content="The Nostr webclient" />
</svelte:head>

<section class="container">
  <div class="flex flex-col gap-2 w-full overflow-x-hidden">
    <ListMain
      queryKey={["kind30000", $loginUser]}
      pubkey={$loginUser}
      let:events
    >
      <!-- <Link
            slot="loading"
            className="underline text-magnum-300 break-all "
            href={`https://nostviewstr.vercel.app/${nip19.npubEncode(pubkey)}/${30000}`}
            >{$_("nostviewstr.kind30000")}</Link
          >
          <Link
            slot="error"
            className="underline text-magnum-300 break-all "
            href={`https://nostviewstr.vercel.app/${nip19.npubEncode(pubkey)}/${30000}`}
            >{$_("nostviewstr.kind30000")}</Link
          >
          <Link
            slot="nodata"
            className="underline text-magnum-300 break-all "
            href={`https://nostviewstr.vercel.app/${nip19.npubEncode(pubkey)}/${30000}`}
            >{$_("nostviewstr.kind30000")}</Link
          > -->
      {@const peopleList = filtered(events)}
      {#if peopleList.length === 0}
        <Link
          className="underline text-magnum-300 break-all "
          href={`https://nostviewstr.vercel.app/${nip19.npubEncode($loginUser)}/${30000}`}
          >{$_("nostviewstr.kind30000")}</Link
        >
      {:else}
        {#each peopleList as event}
          <button
            on:click={() => handleClickToList(event)}
            class="border border-magnum-500 hover:opacity-75 focus:opacity-50 rounded-lg overflow-hidden"
          >
            <ListLinkCard {event} /></button
          >
        {/each}
      {/if}
    </ListMain>
    <div
      class="mb-16 border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center"
    >
      <Link
        className=" font-semibold text-magnum-300 break-all inline-flex"
        href={`https://nostviewstr.vercel.app/${nip19.npubEncode($loginUser)}/${30000}`}
        >{$_("nostviewstr.kind30000")}<SquareArrowOutUpRight size={16} /></Link
      >
    </div>
  </div>
</section>
