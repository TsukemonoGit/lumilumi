<script lang="ts">
  import { goto } from "$app/navigation";
  import Link from "$lib/components/Elements/Link.svelte";
  import ChannelMetadata from "$lib/components/NostrElements/kindEvents/ChannelMetadata.svelte";
  import ChannelMain from "$lib/components/renderSnippets/nostr/ChannelMain.svelte";

  import { SquareArrowOutUpRight } from "lucide-svelte";

  import * as nip19 from "nostr-tools/nip19";
  //import * as Nostr from "nostr-typedef";
  import { t as _ } from "@konemono/svelte5-i18n";
  import CreateChannel from "./CreateChannel.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import ChannelMetadataLayout from "$lib/components/NostrElements/kindEvents/ChannelMetadataLayout.svelte";
  import EmptyListCard from "$lib/components/NostrElements/kindEvents/layout/EmptyListCard.svelte";
  import { encodetoNote } from "$lib/func/encode";
  import ChannelEllipsisMenu from "$lib/components/NostrElements/kindEvents/ChannelEllipsisMenu.svelte";

  const handleClickToChannel = (id: string) => {
    goto(`/channel/${nip19.noteEncode(id)}`);
  };
</script>

<section class=" flex flex-col gap-2 max-w-full overflow-x-hidden w-full">
  {#if !lumiSetting.get().pubkey}
    <a
      href="/settings"
      class="whitespace-pre-wrap break-words p-2 underline text-magnum-400 hover:opacity-75"
      style="word-break: break-word;">{$_("setting.pubkey")}</a
    >
  {:else}
    <CreateChannel />
    <ChannelMain
      queryKey={["kind10005", lumiSetting.get().pubkey]}
      pubkey={lumiSetting.get().pubkey}
    >
      {#snippet children({ event })}
        {#each event.tags.filter((tag) => tag[0] === "e") as [tag, id]}
          <div
            class="text-left w-full border border-magnum-500 rounded-lg overflow-hidden"
          >
            <ChannelMetadata {id}>
              {#snippet channelMetadata(event)}
                {#if event}
                  <ChannelMetadataLayout
                    handleClickToChannel={() => handleClickToChannel(id)}
                    {id}
                    linkButtonTitle={`/channel/${nip19.noteEncode(id)}`}
                    clickAction={true}
                    {event}
                  />
                {:else}
                  <EmptyListCard
                    handleClickToChannel={() => handleClickToChannel(id)}
                    linkButtonTitle={`/channel/${nip19.noteEncode(id)}`}
                    {id}
                  >
                    {encodetoNote(id)}
                    {#snippet menu()}
                      <ChannelEllipsisMenu heyaId={id} />
                    {/snippet}
                  </EmptyListCard>
                {/if}
              {/snippet}
            </ChannelMetadata>
          </div>
        {/each}
      {/snippet}
    </ChannelMain>
  {/if}
  <a
    href={"/channel/global"}
    class="w-full border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center font-semibold text-magnum-300 break-all items-center"
  >
    {$_("channel.global")}
  </a>
</section>
