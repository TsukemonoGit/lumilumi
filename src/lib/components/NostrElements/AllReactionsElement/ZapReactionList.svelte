<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { decode } from "light-bolt11-decoder";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";
  import { Zap } from "lucide-svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";

  export let events: Nostr.Event[];

  const getAmount = (event: Nostr.Event): number => {
    return Math.floor(
      Number(
        decode(
          event.tags.find((tag) => tag[0] === "bolt11")?.[1] ?? ""
        )?.sections.find((item) => item.name === "amount")?.value
      ) / 1000
    );
  };

  const filterEventsByAmount = (events: Nostr.Event[], amount: number) => {
    return events.filter((event) => getAmount(event) === amount);
  };

  $: amounts = [...new Set(events.map(getAmount))].sort((a, b) => b - a); // Sort amounts in descending order

  const zapperEvent = (event: Nostr.Event): Nostr.Event | undefined => {
    try {
      return JSON.parse(
        event.tags.find((tag) => tag[0] === "description")?.[1] ?? ""
      );
    } catch (error) {
      return undefined;
    }
  };
</script>

<CollapsibleList title="Zap" bind:amount={events.length}>
  {#each amounts as amount}
    <div
      class="max-w-full break-words whitespace-pre-line m-1 box-border overflow-hidden event-card flex items-center align-middle"
    >
      <Zap class="stroke-orange-400 fill-orange-400" size={20} />
      <div class="min-w-8 flex justify-center">{amount}</div>
      <div class="flex-wrap px-2 gap-1 items-center">
        {#each filterEventsByAmount(events, amount) as event (event.id)}
          {@const zapper = zapperEvent(event)}
          {#if zapper}
            <Metadata
              queryKey={["metadata", zapper?.pubkey]}
              pubkey={zapper.pubkey ?? ""}
              let:metadata
            >
              <UserMenu
                slot="loading"
                pubkey={zapper.pubkey ?? ""}
                metadata={undefined}
                size={24}
              />

              <UserMenu
                slot="error"
                pubkey={zapper.pubkey ?? ""}
                metadata={undefined}
                size={24}
              />

              <UserMenu
                slot="nodata"
                pubkey={zapper.pubkey ?? ""}
                metadata={undefined}
                size={24}
              />

              <UserMenu pubkey={zapper.pubkey ?? ""} {metadata} size={24} />
            </Metadata>
            {#if zapper.content !== ""}<div
                class="inline-flex my-auto break-all"
              >
                {zapper.content}
              </div>{/if}
          {/if}
        {/each}
      </div>
    </div>
  {/each}
</CollapsibleList>
