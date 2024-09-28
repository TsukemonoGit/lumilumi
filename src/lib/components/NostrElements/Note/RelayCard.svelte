<script lang="ts">
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import { formatUrl, relayInfoFun } from "$lib/func/util";
  import { showImg, toastSettings } from "$lib/stores/stores";
  import {
    Copy,
    Ellipsis,
    FileJson2,
    SquareArrowOutUpRight,
  } from "lucide-svelte";
  import Avatar from "svelte-boring-avatars";
  import { _ } from "svelte-i18n";

  export let url: string;
  export let write: boolean;
  export let read: boolean;

  let imageLoaded = true;
  let dialogOpen: any;
  let size = 48;

  let menuTexts = [
    { text: `${$_("menu.copy.relayURL")}`, icon: Copy, num: 3 },
    { text: `${$_("menu.json")}`, icon: FileJson2, num: 0 },
    {
      text: `${$_("menu.open.relayHtml")}`,
      icon: SquareArrowOutUpRight,
      num: 4,
    },

    { text: `${$_("menu.nostr-watch")}`, icon: SquareArrowOutUpRight, num: 1 },
    { text: `${$_("menu.nostrrr")}`, icon: SquareArrowOutUpRight, num: 2 },
  ];

  const handleSelectItem = async (index: number) => {
    try {
      //const encodedrelay = nip19.nrelayEncode(url);
      const hostname = new URL(url).hostname;

      switch (menuTexts[index].num) {
        case 0:
          //view json
          $dialogOpen = true;
          break;

        case 1:
          //nostrWatch
          //https://legacy.nostr.watch/
          window.open(
            `https://legacy.nostr.watch/relay/${hostname}`,
            "_blank",
            "noreferrer"
          );
          //`https://nostrrr.com/relay/${html.hostname}`,
          // `https://nostr.watch/relay/${html.hostname}`,
          //const njumpURL = `https://njump.me/${encodedrelay}`;

          //  window.open(njumpURL, "_blank", "noreferrer");
          break;
        case 2:
          //nostrrr

          window.open(
            `https://nostrrr.com/relay/${hostname}`,
            "_blank",
            "noreferrer"
          );
          //`https://nostrrr.com/relay/${html.hostname}`,
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
</script>

{#await relayInfoFun(url)}
  {url} read:{read} write:{write}
{:then relayInfo}
  {#if !relayInfo}
    {url} read:{read} write:{write}
  {:else}
    <!--ICON そのた-->
    <div class="pl-1 grid grid-cols-[auto_1fr] gap-1.5">
      <div
        class="w-12 h-12 rounded-full bg-zinc-800 text-center flex items-center justify-center text-lg"
      >
        {#if $showImg && relayInfo.icon}
          <UserAvatar
            url={relayInfo.icon}
            name={url ?? ""}
            pubkey={undefined}
            {size}
          />
        {:else if $showImg && imageLoaded}
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
            <DropdownMenu {menuTexts} {handleSelectItem}>
              <div
                class="w-fit text-magnum-400 p-1 hover:opacity-75 active:opacity-50"
              >
                <Ellipsis />
              </div>
            </DropdownMenu>
          </div>
        </div>

        {url}

        <div
          class="my-2 whitespace-pre-wrap break-words"
          style="word-break: break-word;"
        >
          {relayInfo.description ?? ""}
        </div>
        {#if relayInfo.supported_nips}
          <div class="w-full flex-wrap flex">
            NIPs:
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

    <Dialog bind:open={dialogOpen}>
      <div slot="main">
        <h2 class="m-0 text-lg font-medium">Relay Information</h2>
        <div
          class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[30vh]"
        >
          {JSON.stringify(relayInfo, null, 2)}
        </div>
      </div></Dialog
    >
  {/if}
{/await}
