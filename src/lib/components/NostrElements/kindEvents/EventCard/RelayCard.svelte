<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";

  import { formatUrl, getRelayInfo } from "$lib/func/util";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { modalState, toastSettings } from "$lib/stores/stores";
  import {
    Copy,
    Ellipsis,
    FileJson2,
    SquareArrowOutUpRight,
    RadioTower,
    Share,
  } from "lucide-svelte";

  import Avatar from "svelte-boring-avatars";
  import { t as _ } from "@konemono/svelte5-i18n";
  import UserAvatar from "../../user/UserAvatar.svelte";
  import { untrack } from "svelte";
  import { type Nip11 } from "nostr-typedef";
  import ModalRelayInfo from "./ModalRelayInfo.svelte";

  interface Props {
    url: string;
    write: boolean;
    read: boolean;
    zIndex: number;
  }

  let { url, write, read, zIndex }: Props = $props();

  let imageLoaded = true;

  let size = 48;

  let encodedUrl = $derived(encodeURIComponent(url));

  // svelte-ignore non_reactive_update
  const menuTexts =
    //page.params.relay !== encodedUrl
    //?
    [
      { text: `${$_("menu.open.relayTimeline")}`, icon: RadioTower, num: 5 },

      { text: `${$_("menu.copy.relayURL")}`, icon: Copy, num: 3 },
      { text: `${$_("menu.json")}`, icon: FileJson2, num: 0 },
      {
        text: `${$_("menu.open.relayHtml")}`,
        icon: SquareArrowOutUpRight,
        num: 4,
      },

      {
        text: `${$_("menu.nostr-watch")}`,
        icon: SquareArrowOutUpRight,
        num: 1,
      },

      { text: `${$_("menu.sharelink")}`, icon: Share, num: 6 },
    ];

  const handleSelectItem = async (index: number) => {
    try {
      //const encodedrelay = nip19.nrelayEncode(url);
      const hostname = new URL(url).hostname;

      switch (menuTexts[index].num) {
        case 0:
          //view json
          //$dialogOpen = true;
          $modalState = {
            isOpen: true,
            component: ModalRelayInfo,
            props: { relayInfo: relayInfo },
          };

          break;

        case 1:
          //nostrWatch
          //https://legacy.nostr.watch/

          window.open(
            `https://legacy.nostr.watch/relay/${hostname}`,
            "_blank",
            "noreferrer"
          );

          // `https://nostr.watch/relay/${html.hostname}`,
          //const njumpURL = `https://njump.me/${encodedrelay}`;

          //  window.open(njumpURL, "_blank", "noreferrer");
          break;

        case 3:
          //Copy relayURL
          try {
            await navigator.clipboard.writeText(url);
            $toastSettings = {
              title: "Success",
              description: `Copied to clipboard`,
              color: "bg-green-500",
            };
          } catch (error: any) {
            console.error(error.message);
            $toastSettings = {
              title: "Error",
              description: "Failed to copy",
              color: "bg-orange-500",
            };
          }
          break;
        case 4:
          //open relay site

          window.open(formatUrl(url), "_blank", "noreferrer");

          break;
        case 5:
          //goto relay page

          goto(`/relay/${encodedUrl}`);
          break;
        case 6:
          //share relay page
          const shareData = {
            title: "",
            //text: "lumilumi",
            url: `${page.url.origin}/relay/${encodedUrl}`,
          };

          try {
            await navigator.share(shareData);
          } catch (error: any) {
            console.error(error.message);
            $toastSettings = {
              title: "Error",
              description: "Failed to share",
              color: "bg-orange-500",
            };
          }
          break;
      }
    } catch (error) {
      console.log("relay encode error");
      $toastSettings = {
        title: "Error",
        description: "relay encode error",
        color: "bg-orange-500",
      };
    }
  };

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
        <div class="ml-auto">
          <DropdownMenu {menuTexts} {zIndex} {handleSelectItem}>
            <div
              class="w-fit text-magnum-400 p-1 hover:opacity-75 active:opacity-50"
            >
              <Ellipsis size={20} />
            </div>
          </DropdownMenu>
        </div>
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
