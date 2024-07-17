<script lang="ts">
  import { goto } from "$app/navigation";
  import Link from "$lib/components/Elements/Link.svelte";
  import ChannelMetadata from "$lib/components/NostrElements/Note/ChannelMetadata.svelte";
  import ChannelMain from "$lib/components/NostrMainData/ChannelMain.svelte";
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  import { loginUser } from "$lib/stores/stores";
  import { SquareArrowOutUpRight } from "lucide-svelte";

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
  <div class="flex flex-col gap-2 max-w-full overflow-x-hidden">
    <ChannelMain
      queryKey={["kind10005", $loginUser]}
      pubkey={$loginUser}
      let:event
    >
      <!-- <Link
            slot="loading"
            className="underline text-magnum-300 break-all "
            href={`https://nostviewstr.vercel.app/${nip19.npubEncode(pubkey)}/${10005}`}
            >{$_("nostviewstr.kind10005")}</Link
          >
          <Link
            slot="error"
            className="underline text-magnum-300 break-all "
            href={`https://nostviewstr.vercel.app/${nip19.npubEncode(pubkey)}/${10005}`}
            >{$_("nostviewstr.kind10005")}</Link
          >
          <Link
            slot="nodata"
            className="underline text-magnum-300 break-all "
            href={`https://nostviewstr.vercel.app/${nip19.npubEncode(pubkey)}/${10005}`}
            >{$_("nostviewstr.kind10005")}</Link
          > -->
      {#each event.tags.filter((tag) => tag[0] === "e") as [tag, id]}
        <div
          class="text-left w-full border border-magnum-500 rounded-lg overflow-hidden"
        >
          <ChannelMetadata
            handleClickToChannel={() => handleClickToChannel(id)}
            {id}
          />
        </div>
      {/each}
    </ChannelMain>
    <div
      class="mb-16 border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center"
    >
      <Link
        className=" font-semibold text-magnum-300 break-all inline-flex"
        href={`https://nostviewstr.vercel.app/${nip19.npubEncode($loginUser)}/${10005}`}
        >{$_("nostviewstr.kind10005")}<SquareArrowOutUpRight size={16} /></Link
      >
    </div>
  </div>
</section>
