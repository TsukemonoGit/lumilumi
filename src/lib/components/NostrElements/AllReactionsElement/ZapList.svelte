<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { decode } from "light-bolt11-decoder";

  import { Zap } from "lucide-svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import UserPopupMenu from "$lib/components/Elements/UserPopupMenu.svelte";

  export let events: Nostr.Event[];
  export let tieKey: string | undefined;

  //とりあえずデコード失敗したら0になるようになってるけどちゃんと取り除いて

  const getAmount = (event: Nostr.Event): number | undefined => {
    const bolt11 = event.tags.find((tag) => tag[0] === "bolt11");
    if (!bolt11 || bolt11.length <= 1) {
      return;
    }
    try {
      const decoded = decode(bolt11[1]);
      if (decoded) {
        return Math.floor(
          Number(
            decoded.sections.find((item) => item.name === "amount")?.value
          ) / 1000
        );
      }
    } catch (error) {
      console.log(error);
      return;
    }
  };

  const filterEventsByAmount = (events: Nostr.Event[], amount: number) => {
    return events.filter((event) => getAmount(event) === amount);
  };

  $: amounts = [...new Set(events.map((event) => getAmount(event) ?? -1))].sort(
    (a, b) => b - a
  ); // Sort amounts in descending order

  const zapperEvent = (event: Nostr.Event): Nostr.Event | undefined => {
    const desc = event.tags.find((tag) => tag[0] === "description");
    if (!desc || desc.length <= 1) {
      return;
    }
    try {
      return JSON.parse(desc[1]);
    } catch (error) {
      return;
    }
  };
</script>

{#each amounts as amount}
  <div
    class="max-w-full break-words whitespace-pre-line box-border overflow-hidden event-card flex items-center align-middle"
  >
    <Zap class="stroke-orange-400 fill-orange-400 min-w-4" size={20} />
    <div class="min-w-8 flex justify-center">
      {amount === -1 ? "invalid event" : amount}
    </div>
    <div class="flex flex-wrap px-2 gap-1 items-center">
      {#each filterEventsByAmount(events, amount) as event (event.id)}
        {@const zapper = zapperEvent(event)}
        {#if zapper}
          <Metadata
            queryKey={["metadata", zapper?.pubkey]}
            pubkey={zapper.pubkey ?? ""}
            let:metadata
          >
            <UserPopupMenu
              slot="loading"
              pubkey={zapper.pubkey ?? ""}
              metadata={undefined}
              size={24}
              depth={0}
              {tieKey}
            />

            <UserPopupMenu
              slot="error"
              pubkey={zapper.pubkey ?? ""}
              metadata={undefined}
              size={24}
              depth={0}
              {tieKey}
            />

            <UserPopupMenu
              slot="nodata"
              pubkey={zapper.pubkey ?? ""}
              metadata={undefined}
              size={24}
              depth={0}
              {tieKey}
            />

            <UserPopupMenu
              pubkey={zapper.pubkey ?? ""}
              {metadata}
              size={24}
              depth={0}
              {tieKey}
            />
          </Metadata>
          {#if zapper.content !== ""}<div
              class="inline-flex break-all align-middle"
            >
              {zapper.content}
            </div>{/if}
        {/if}
      {/each}
    </div>
  </div>
{/each}
