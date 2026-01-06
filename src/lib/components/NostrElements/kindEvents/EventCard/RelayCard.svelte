<script lang="ts">
  import { formatUrl, getRelayInfo } from "$lib/func/util";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  import { Ellipsis } from "lucide-svelte";

  import Avatar from "svelte-boring-avatars";
  import { t as _ } from "@konemono/svelte5-i18n";
  import UserAvatar from "../../user/UserAvatar.svelte";
  import { untrack } from "svelte";
  import { type Nip11 } from "nostr-typedef";

  import RelayMenu from "../../RelayMenu.svelte";

  interface Props {
    url: string;
    write: boolean;
    read: boolean;
    zIndex: number;
  }

  let { url, write, read, zIndex }: Props = $props();

  let imageLoaded = true;

  let size = 48;

  let relayInfo: Nip11.RelayInfo | undefined = $state();
  $effect(() => {
    if (url) {
      untrack(async () => {
        relayInfo = await getRelayInfo(url);
      });
    }
  });
</script>

{#if !relayInfo}
  {url} read:{read} write:{write}
{:else}
  <!--ICON そのた-->
  <div class="pl-1 grid grid-cols-[auto_1fr] gap-1.5">
    <div
      class="w-12 h-12 rounded-full bg-zinc-800 text-center flex items-center justify-center text-lg"
    >
      {#if lumiSetting.get().showImg && relayInfo.icon}
        <UserAvatar
          url={relayInfo.icon}
          name={url ?? ""}
          pubkey={undefined}
          {size}
        />
      {:else if lumiSetting.get().showImg && imageLoaded}
        <UserAvatar
          url={formatUrl(url) + "favicon.ico"}
          name={url ?? ""}
          pubkey={undefined}
          {size}
        />
      {:else}
        <Avatar {size} name={url} variant="beam" />
      {/if}
    </div>
    <!-- title-description -->

    <div>
      <!--titleとR/W ...-->
      <div class="flex items-center gap-1">
        <div class="text-md text-magnum-100 font-bold">
          {relayInfo.name}
        </div>
        {#if read || write}
          <div
            class="h-fit border border-primary-400 break-keep text-xs font-bold w-8 text-center"
          >
            {#if read && write}
              RW
            {:else if read}
              R
            {:else}
              W
            {/if}
          </div>
        {/if}
        <RelayMenu {url} {zIndex} {relayInfo}>
          <div
            class="ml-auto w-fit text-magnum-400 p-1 hover:opacity-75 active:opacity-50"
          >
            <Ellipsis size={20} />
          </div>
        </RelayMenu>
      </div>
      {#if relayInfo.description}
        <div
          class="mb-2 whitespace-pre-wrap break-words"
          style="word-break: break-word;"
        >
          {relayInfo.description ?? ""}
        </div>{/if}
      <div
        class=" whitespace-pre-wrap break-words text-sm"
        style="word-break: break-word;"
      >
        <span class="font-bold">URL:</span>
        {url}
      </div>

      {#if relayInfo.software}
        <div
          class=" whitespace-pre-wrap break-words text-sm"
          style="word-break: break-word;"
        >
          <span class="font-bold">Software: </span>{relayInfo.software}
        </div>{/if}
      {#if relayInfo.supported_nips}
        <div class="w-full flex-wrap flex text-sm">
          <span class="font-bold">NIPs:</span>
          {#each relayInfo.supported_nips as nip}
            <a
              class="px-1 whitespace-nowrap text-magnum-400 font-semibold"
              rel="external noreferrer"
              target="_blank"
              href={"https://github.com/nostr-protocol/nips/blob/master/" +
                nip.toString().padStart(2, "0") +
                ".md"}>{nip}</a
            >
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
