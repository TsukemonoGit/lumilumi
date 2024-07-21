<script lang="ts">
  import { slicedEvent, toastSettings } from "$lib/stores/stores";
  import {
    Copy,
    Earth,
    Ellipsis,
    FileJson2,
    SquareArrowOutUpRight,
    Notebook,
    Smile,
    Radio,
    Link,
  } from "lucide-svelte";

  import * as Nostr from "nostr-typedef";
  import { getRelaysById, publishEvent } from "$lib/func/nostr";
  import { nip19 } from "nostr-tools";
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { goto } from "$app/navigation";
  import { _ } from "svelte-i18n";
  import { locale } from "svelte-i18n";
  import { page } from "$app/stores";
  export let note: Nostr.Event;
  export let indexes: number[] | undefined = undefined;

  let dialogOpen: any;

  let menuTexts = [
    {
      text: $_("menu.copy.naddr"),
      icon: Copy,
      num: 3,
    },
    { text: `${$_("menu.json")}`, icon: FileJson2, num: 0 },
    { text: `${$_("menu.njump")}`, icon: SquareArrowOutUpRight, num: 1 },
    //{ text: `${$_("menu.translate")}`, icon: Earth, num: 2 },
    // { text: `${$_("menu.note")}`, icon: Notebook, num: 4 },
    { text: `${$_("menu.broadcast")}`, icon: Radio, num: 6 },
    { text: `${$_("menu.copylink")}`, icon: Link, num: 7 },
  ];

  if (indexes !== undefined) {
    menuTexts = menuTexts.filter((item) => indexes.includes(item.num));
  }

  const handleSelectItem = async (index: number) => {
    const naddrpointer: nip19.AddressPointer = {
      kind: note.kind,
      identifier: note.tags.find((item) => item[0] === "d")?.[1] ?? "",
      pubkey: note.pubkey,
      relays: getRelaysById(note.id),
    };
    const naddr = nip19.naddrEncode(naddrpointer);
    switch (menuTexts[index].num) {
      case 0:
        //view json
        $dialogOpen = true;
        break;

      case 1:
        //open in njump

        const url = `https://njump.me/${naddr}`;

        window.open(url, "_blank", "noreferrer");
        break;

      case 3:
        //Copy EventID
        try {
          await navigator.clipboard.writeText(naddr);
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
      // case 4:
      //   //Goto Note page
      //   goto(`/${replaceable ? naddr : nevent}`);
      //   break;
      // case 5:
      //   //open in emojito
      //   const emojito = `https://emojito.meme/a/${naddr}`;

      //   window.open(emojito, "_blank", "noreferrer");
      //   break;

      case 6:
        //broadcast
        publishEvent(note);
        setTimeout(() => {
          slicedEvent.update((value) => value);
          console.log("こうしんしたよ");
        }, 1000);
        break;
      case 7:
        //Copy link
        try {
          await navigator.clipboard.writeText(
            `${$page.url.origin}/list/${naddr}`
          );
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
  <Ellipsis size="20" />
</DropdownMenu>

<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  <div slot="main">
    <h2 class="m-0 text-lg font-medium">EVENT JSON</h2>
    <div
      class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[30vh]"
    >
      {JSON.stringify(note, null, 2)}
    </div>

    <h2 class="m-0 text-lg font-medium">Seen on</h2>
    <div class="break-words whitespace-pre-wrap">
      {getRelaysById(note.id).join(", ")}
    </div>
  </div></Dialog
>
