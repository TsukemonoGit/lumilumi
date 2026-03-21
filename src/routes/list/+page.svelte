<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import ListLinkCard from "$lib/components/NostrElements/kindEvents/EventCard/ListLinkCard.svelte";
  import ListMain from "$lib/components/renderSnippets/nostr/ListMain.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";

  import { SquareArrowOutUpRight } from "lucide-svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { encodetoNpub } from "$lib/func/encode";
  import CreateList from "./CreateList.svelte";
  import { queryClient } from "$lib/stores/stores";
  import type { EventPacket } from "rx-nostr";

  let encodePub = $derived(encodetoNpub(lumiSetting.get().pubkey));

  let queryKey = $derived(["kind30000", lumiSetting.get().pubkey]);
</script>

{#if !lumiSetting.get()?.pubkey}
  <a
    href="/settings"
    class="whitespace-pre-wrap break-words p-2 underline text-magnum-400 hover:opacity-75"
    style="word-break: break-word;">{$_("setting.pubkey")}</a
  >
{:else}
  <section>
    <div class="flex flex-col gap-2 w-full overflow-x-hidden">
      <CreateList {queryKey} />
      <ListMain {queryKey} pubkey={lumiSetting.get().pubkey} kind={30000}>
        {#snippet children({ events })}
          {#each events as event}
            <div class="border border-magnum-500 rounded-lg overflow-hidden">
              <ListLinkCard
                {event}
                depth={0}
                onDelete={() => {
                  queryClient.setQueryData(
                    queryKey,
                    (oldData: EventPacket[] | undefined) => {
                      return oldData?.filter(
                        (packet) => packet.event.id !== event.id,
                      );
                    },
                  );
                }}
              ></ListLinkCard>
            </div>
          {/each}
        {/snippet}
      </ListMain>
      <div
        class=" border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center"
      >
        <Link
          className=" font-semibold text-magnum-300 break-all inline-flex"
          href={`https://nostviewstr.vercel.app/${encodePub}/${30000}`}
          >{$_("nostviewstr.kind30000")}<SquareArrowOutUpRight
            size={16}
          /></Link
        >
      </div>
    </div>
  </section>
{/if}
