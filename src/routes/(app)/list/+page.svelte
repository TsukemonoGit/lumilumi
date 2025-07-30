<script lang="ts">
  import { goto } from "$app/navigation";
  import Link from "$lib/components/Elements/Link.svelte";
  import ListLinkCard from "$lib/components/NostrElements/kindEvents/EventCard/ListLinkCard.svelte";
  import ListMain from "$lib/components/renderSnippets/nostr/ListMain.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";

  import * as nip19 from "nostr-tools/nip19";
  import * as Nostr from "nostr-typedef";
  import { SquareArrowOutUpRight } from "lucide-svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

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

{#if !lumiSetting.get().pubkey}
  <a
    href="/settings"
    class="whitespace-pre-wrap break-words p-2 underline text-magnum-400 hover:opacity-75"
    style="word-break: break-word;">{$_("setting.pubkey")}</a
  >
{:else}
  <section>
    <div class="flex flex-col gap-2 w-full overflow-x-hidden">
      <ListMain
        queryKey={["kind30000", lumiSetting.get().pubkey]}
        pubkey={lumiSetting.get().pubkey}
        kind={30000}
      >
        {#snippet children({ events })}
          {@const peopleList = filtered(events)}
          {#if peopleList.length === 0}
            <Link
              className="underline text-magnum-300 break-all "
              href={`https://nostviewstr.vercel.app/${nip19.npubEncode(lumiSetting.get().pubkey)}/${30000}`}
              >{$_("nostviewstr.kind30000")}</Link
            >
          {:else}
            {#each peopleList as event}
              <button
                onclick={() => handleClickToList(event)}
                class="border border-magnum-500 hover:opacity-75 focus:opacity-50 rounded-lg overflow-hidden"
              >
                <ListLinkCard {event} depth={0} /></button
              >
            {/each}
          {/if}
        {/snippet}
      </ListMain>
      <div
        class=" border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center"
      >
        <Link
          className=" font-semibold text-magnum-300 break-all inline-flex"
          href={`https://nostviewstr.vercel.app/${nip19.npubEncode(lumiSetting.get().pubkey)}/${30000}`}
          >{$_("nostviewstr.kind30000")}<SquareArrowOutUpRight
            size={16}
          /></Link
        >
      </div>
    </div>
  </section>
{/if}
