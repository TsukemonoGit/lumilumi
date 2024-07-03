<script lang="ts">
  import { goto } from "$app/navigation";
  import Link from "$lib/components/Elements/Link.svelte";
  import ChannelMetadata from "$lib/components/NostrElements/Note/ChannelMetadata.svelte";
  import ChannelMain from "$lib/components/NostrMainData/ChannelMain.svelte";
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";

  import Text from "$lib/components/NostrMainData/Text.svelte";
  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  import { _ } from "svelte-i18n";

  const handleClickToChannel = (id: string) => {
    goto(`/channel/${nip19.noteEncode(id)}`);
  };
  //10005がない場合はのりすにとばす？
</script>

<svelte:head>
  <title>Lumilumi-Note</title>
  <meta name="description" content="The Nostr webclient" />
</svelte:head>
<section class="container">
  <NostrMain let:pubkey let:localRelays>
    <SetDefaultRelays {pubkey} {localRelays} let:relays let:status>
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>
      <div class="flex flex-col gap-2 max-w-full overflow-x-hidden">
        <ChannelMain queryKey={["kind10005", pubkey]} {pubkey} let:event>
          <div slot="loading">loading</div>
          <div slot="error">error</div>
          <Link
            slot="nodata"
            className="underline text-magnum-300 break-all "
            href={`https://nostviewstr.vercel.app/${pubkey}/${10005}`}
            >{$_("nostviewstr.kind10005")}</Link
          >
          {#each event.tags.filter((tag) => tag[0] === "e") as [tag, id]}
            <Text {id} queryKey={["kind40", id]}>
              <button
                class="border border-magnum-500 hover:opacity-75 focus:opacity-50 rounded-lg"
                slot="loading"
                on:click={() => {
                  handleClickToChannel(id);
                }}>loading {nip19.noteEncode(id)}</button
              >
              <button
                class="border border-magnum-500 hover:opacity-75 focus:opacity-50 rounded-lg"
                slot="error"
                on:click={() => {
                  handleClickToChannel(id);
                }}>error {nip19.noteEncode(id)}</button
              >
              <button
                class="border border-magnum-500 hover:opacity-75 focus:opacity-50 rounded-lg"
                slot="nodata"
                on:click={() => {
                  handleClickToChannel(id);
                }}>nodata {nip19.noteEncode(id)}</button
              >
              <button
                class="text-left w-full border border-magnum-500 hover:opacity-75 focus:opacity-50 rounded-lg overflow-hidden"
                on:click={() => {
                  handleClickToChannel(id);
                }}
              >
                <ChannelMetadata {id} /></button
              >
            </Text>
          {/each}
        </ChannelMain>
      </div>
    </SetDefaultRelays>
  </NostrMain>
</section>
