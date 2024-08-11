<script lang="ts">
  import { afterNavigate, goto } from "$app/navigation";
  import Link from "$lib/components/Elements/Link.svelte";
  import ChannelMetadata from "$lib/components/NostrElements/Note/ChannelMetadata.svelte";
  import ChannelMain from "$lib/components/NostrMainData/ChannelMain.svelte";
  import { setTieKey } from "$lib/func/nostr";
  import { loginUser, toastSettings } from "$lib/stores/stores";
  import { Search, SquareArrowOutUpRight } from "lucide-svelte";

  import { nip19 } from "nostr-tools";
  //import * as Nostr from "nostr-typedef";
  import { _ } from "svelte-i18n";

  const handleClickToChannel = (id: string) => {
    goto(`/channel/${nip19.noteEncode(id)}`);
  };
  setTieKey("undefined");
  afterNavigate(() => {
    if (!$loginUser) {
      $toastSettings = {
        title: "Warning",
        description: $_("channel.settingswarning"),
        color: "bg-orange-500",
      };

      goto("/settings");
    }
  });
</script>

<svelte:head>
  <title>Lumilumi-Channel</title>
  <meta property="og:description" content="Channel" />
  <meta name="description" content="Channel" />
</svelte:head>
{#if $loginUser}
  <section
    class="container flex flex-col gap-2 max-w-full overflow-x-hidden w-full"
  >
    <ChannelMain
      queryKey={["kind10005", $loginUser]}
      pubkey={$loginUser}
      let:event
    >
      {#each event.tags.filter((tag) => tag[0] === "e") as [tag, id]}
        <div
          class="text-left w-full border border-magnum-500 rounded-lg overflow-hidden"
        >
          <ChannelMetadata
            handleClickToChannel={() => handleClickToChannel(id)}
            {id}
            linkButtonTitle={`/channel/${nip19.noteEncode(id)}`}
          />
        </div>
      {/each}
    </ChannelMain>

    <Link
      className="w-full border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center font-semibold text-magnum-300 break-all "
      href={`https://nostviewstr.vercel.app/${nip19.npubEncode($loginUser)}/${10005}`}
      >{$_("nostviewstr.kind10005")}<SquareArrowOutUpRight size={16} /></Link
    >
    <a
      href={"/channel/global"}
      class="w-full border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center font-semibold text-magnum-300 break-all items-center"
    >
      {$_("channel.global")}
    </a>
  </section>
{/if}
