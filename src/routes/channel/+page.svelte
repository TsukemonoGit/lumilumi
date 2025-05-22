<script lang="ts">
  import { goto } from "$app/navigation";
  import Link from "$lib/components/Elements/Link.svelte";
  import ChannelMetadata from "$lib/components/NostrElements/kindEvents/ChannelMetadata.svelte";
  import ChannelMain from "$lib/components/renderSnippets/nostr/ChannelMain.svelte";

  import { loginUser } from "$lib/stores/stores";
  import { SquareArrowOutUpRight } from "lucide-svelte";

  import { nip19 } from "nostr-tools";
  //import * as Nostr from "nostr-typedef";
  import { _ } from "svelte-i18n";
  import CreateChannel from "./CreateChannel.svelte";

  const tieKey = undefined;
  const handleClickToChannel = (id: string) => {
    goto(`/channel/${nip19.noteEncode(id)}`);
  };
</script>

<section class=" flex flex-col gap-2 max-w-full overflow-x-hidden w-full">
  {#if !$loginUser}
    <a
      href="/settings"
      class="whitespace-pre-wrap break-words p-2 underline text-magnum-400 hover:opacity-75"
      style="word-break: break-word;">{$_("setting.pubkey")}</a
    >
  {:else}
    <CreateChannel {tieKey} />
    <ChannelMain queryKey={["kind10005", $loginUser]} pubkey={$loginUser}>
      {#snippet children({ event })}
        {#each event.tags.filter((tag) => tag[0] === "e") as [tag, id]}
          <div
            class="text-left w-full border border-magnum-500 rounded-lg overflow-hidden"
          >
            <ChannelMetadata
              handleClickToChannel={() => handleClickToChannel(id)}
              {id}
              linkButtonTitle={`/channel/${nip19.noteEncode(id)}`}
              {tieKey}
            />
          </div>
        {/each}
      {/snippet}
    </ChannelMain>

    <Link
      className="w-full border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center font-semibold text-magnum-300 break-all "
      href={`https://nostviewstr.vercel.app/${nip19.npubEncode($loginUser)}/${10005}`}
      >{$_("nostviewstr.kind10005")}<SquareArrowOutUpRight size={16} /></Link
    >
  {/if}
  <a
    href={"/channel/global"}
    class="w-full border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center font-semibold text-magnum-300 break-all items-center"
  >
    {$_("channel.global")}
  </a>
</section>
