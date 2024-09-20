<script lang="ts">
  import { afterNavigate, goto } from "$app/navigation";
  import Link from "$lib/components/Elements/Link.svelte";
  import ListLinkCard from "$lib/components/NostrElements/Note/ListLinkCard.svelte";
  import ListMain from "$lib/components/NostrMainData/ListMain.svelte";
  import { _ } from "svelte-i18n";

  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  import { SquareArrowOutUpRight } from "lucide-svelte";
  import { loginUser, toastSettings } from "$lib/stores/stores";

  const tieKey = undefined;

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
  afterNavigate(() => {
    if (!$loginUser) {
      $toastSettings = {
        title: "Warning",
        description: $_("list.settingswarning"),
        color: "bg-orange-500",
      };

      goto("/settings");
    }
  });
</script>

<svelte:head>
  <title>Lumilumi-List</title><meta property="og:description" content="List" />
  <meta name="description" content="List" />
</svelte:head>
{#if $loginUser}
  <section class="container">
    <div class="flex flex-col gap-2 w-full overflow-x-hidden">
      <ListMain
        queryKey={["kind30000", $loginUser]}
        pubkey={$loginUser}
        let:events
      >
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
              <ListLinkCard {event} depth={0} {tieKey} /></button
            >
          {/each}
        {/if}
      </ListMain>
      <div
        class=" border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center"
      >
        <Link
          className=" font-semibold text-magnum-300 break-all inline-flex"
          href={`https://nostviewstr.vercel.app/${nip19.npubEncode($loginUser)}/${30000}`}
          >{$_("nostviewstr.kind30000")}<SquareArrowOutUpRight
            size={16}
          /></Link
        >
      </div>
    </div>
  </section>
{/if}
