<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import {
    Copy,
    Earth,
    Ellipsis,
    FileJson2,
    Link,
    Notebook,
    Radio,
    RefreshCcw,
    Share,
    SquareArrowOutUpRight,
  } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import DropdownMenu from "./DropdownMenu.svelte";
  import Dialog from "./Dialog.svelte";
  import { nip19 } from "nostr-tools";
  import { toastSettings } from "$lib/stores/stores";
  import { getRelaysById, publishEvent } from "$lib/func/nostr";
  import type { Profile } from "$lib/types";
  import { page } from "$app/stores";
  export let metadata: Nostr.Event;
  export let prof: Profile;
  let dialogOpen: any;
  let menuTexts = [
    { text: `${$_("menu.copy.pubkey")}`, icon: Copy, num: 3 },

    { text: `${$_("menu.updateProfile")}`, icon: RefreshCcw, num: 4 },

    { text: `${$_("menu.json")}`, icon: FileJson2, num: 0 },
    { text: `${$_("menu.njump")}`, icon: SquareArrowOutUpRight, num: 1 },

    { text: `${$_("menu.broadcast")}`, icon: Radio, num: 6 },
    { text: `${$_("menu.copylink")}`, icon: Share, num: 7 },
  ];

  const handleSelectItem = async (index: number) => {
    const encodedPub = nip19.npubEncode(metadata.pubkey);

    switch (menuTexts[index].num) {
      case 0:
        //view json
        $dialogOpen = true;
        break;

      case 1:
        //open in njump

        const url = `https://njump.me/${encodedPub}`;

        window.open(url, "_blank", "noreferrer");
        break;

      case 3:
        //Copy EventID
        try {
          await navigator.clipboard.writeText(encodedPub);
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

      case 6:
        //broadcast
        publishEvent(metadata);

        break;
      case 7:
        //Share link
        const shareData = {
          //title: "",
          //text: "lumilumi",
          url: `${$page.url.origin}/${encodedPub}`,
        };

        try {
          // await navigator.clipboard.writeText(
          //   `${$page.url.origin}/${encodedPub}`
          // );
          await navigator.share(shareData);
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
    }
  };
</script>

<DropdownMenu {menuTexts} {handleSelectItem}>
  <div
    class="w-fit rounded-full bg-neutral-200 text-magnum-600 p-1 hover:opacity-75 active:opacity-50"
  >
    <Ellipsis />
  </div>
</DropdownMenu>

<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  <div slot="main">
    <h2 class="m-0 text-lg font-medium">EVENT JSON</h2>
    <div
      class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[30vh]"
    >
      {JSON.stringify(metadata, null, 2)}
    </div>
    <h2 class="mt-1 text-lg font-medium">User Data</h2>
    <div
      class=" overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[25vh]"
    >
      {#each Object.entries(prof) as [data, index]}
        <div class="flex flex-col py-1">
          <div class="font-bold whitespace-pre-wrap break-wards">
            {data}
          </div>
          <div class="ml-2 whitespace-pre-wrap break-all">
            {prof[data]}
          </div>
        </div>
      {/each}
    </div>

    <h2 class="m-0 text-lg font-medium">Seen on</h2>
    <div class="break-words whitespace-pre-wrap">
      {getRelaysById(metadata.id).join(", ")}
    </div>
  </div></Dialog
>
