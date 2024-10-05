<script lang="ts">
  import { slicedEvent, toastSettings } from "$lib/stores/stores";
  import {
    Copy,
    Earth,
    Ellipsis,
    FileJson2,
    SquareArrowOutUpRight,
    Smile,
    Radio,
    Share,
    NotepadText,
    Tv,
    Squirrel,
    Layers,
    Notebook,
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
  import { nostviewstrable } from "$lib/func/util";
  export let note: Nostr.Event;
  export let indexes: number[] | undefined = undefined;
  export let TriggerIcon = Ellipsis;
  export let iconSize = 20;
  export let iconClass = "";
  export let tieKey: string | undefined;

  let dialogOpen: any;
  const replaceable =
    (note.kind >= 30000 && note.kind < 40000) ||
    (note.kind >= 10000 && note.kind < 20000) ||
    note.kind === 0 ||
    note.kind === 3;
  let menuTexts = [
    {
      text: $_("menu.copy.text"),
      icon: NotepadText,
      num: 8,
    },
    {
      text: `${replaceable ? $_("menu.copy.naddr") : $_("menu.copy.nevent")}`,
      icon: Copy,
      num: 3,
    },
    { text: `${$_("menu.json")}`, icon: FileJson2, num: 0 },
    { text: `${$_("menu.njump")}`, icon: SquareArrowOutUpRight, num: 1 },
    { text: `${$_("menu.translate")}`, icon: Earth, num: 2 },
    { text: `${$_("menu.note")}`, icon: Notebook, num: 4 },
    { text: `${$_("menu.broadcast")}`, icon: Radio, num: 6 },
    { text: `${$_("menu.sharelink")}`, icon: Share, num: 7 },
  ];

  //30030 emojitoリンク
  if (note.kind === 30030) {
    menuTexts?.push({ text: `${$_("menu.emoji")}`, icon: Smile, num: 5 });
  }

  //30311 zap.streamリンク
  if (note.kind === 30311) {
    menuTexts?.push({ text: `${$_("menu.stream")}`, icon: Tv, num: 9 });
  }
  //31990 App Managerリンク
  if (note.kind === 31990) {
    menuTexts?.push({ text: `${$_("menu.nostrapp")}`, icon: Layers, num: 11 });
  }
  //replaceable のすとびうあのリンク
  if (nostviewstrable.includes(note.kind)) {
    menuTexts?.push({
      text: `${$_("menu.nostviewstr")}`,
      icon: Squirrel,
      num: 10,
    });
  }
  if (indexes !== undefined) {
    menuTexts = menuTexts.filter((item) => indexes.includes(item.num));
  }

  const handleSelectItem = async (index: number) => {
    //  console.log(menuTexts[index]);
    const eventpointer: nip19.EventPointer = {
      id: note.id,
      relays: tieKey ? getRelaysById(note.id, tieKey) : [],
      author: note.pubkey,
      kind: note.kind,
    };
    const naddrpointer: nip19.AddressPointer = {
      kind: note.kind,
      identifier: note.tags.find((item) => item[0] === "d")?.[1] ?? "",
      pubkey: note.pubkey,
      relays: tieKey ? getRelaysById(note.id, tieKey) : [],
    };
    const naddr = nip19.naddrEncode(naddrpointer);
    const nevent = nip19.neventEncode(eventpointer);
    switch (menuTexts[index].num) {
      case 0:
        //view json
        $dialogOpen = true;
        break;

      case 1:
        //open in njump

        const url = `https://njump.me/${replaceable ? naddr : nevent}`;

        window.open(url, "_blank", "noreferrer");
        break;

      case 2:
        //Translate
        const translateUrl = `https://translate.google.com/?sl=auto&tl=${$locale}&op=translate&text=${encodeURIComponent(note.content)}`;

        window.open(translateUrl, "_blank", "noreferrer");
        break;

      case 3:
        //Copy EventID
        try {
          await navigator.clipboard.writeText(replaceable ? naddr : nevent);
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
        //Goto Note page
        goto(`/${replaceable ? naddr : nevent}`);
        break;
      case 5:
        //open in emojito
        const emojito = `https://emojito.meme/a/${naddr}`;

        window.open(emojito, "_blank", "noreferrer");
        break;

      case 6:
        //broadcast
        publishEvent(note);
        setTimeout(() => {
          slicedEvent.update((value) => value);
          console.log("こうしんしたよ");
        }, 1000);
        break;
      case 7:
        //Share link
        const shareData = {
          //title: "",
          //text: "lumilumi",
          url: `${$page.url.origin}/${replaceable ? naddr : nevent}`,
        };

        try {
          await navigator.share(shareData);
          // await navigator.clipboard.writeText(
          //   `${$page.url.origin}/${replaceable ? naddr : nevent}`
          // );
          $toastSettings = {
            title: "Success",
            description: `shared successfully`,
            color: "bg-green-500",
          };
        } catch (error: any) {
          console.error(error.message);
          $toastSettings = {
            title: "Error",
            description: "Failed to share",
            color: "bg-orange-500",
          };
        }
        break;

      case 8:
        //Copy text
        try {
          await navigator.clipboard.writeText(note.content);
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
      case 9:
        //open in zap.stream
        const zapStream = `https://zap.stream/${naddr}`;

        window.open(zapStream, "_blank", "noreferrer");
        break;
      case 10:
        //open in nostviewer
        const nostviewer = `https://nostviewstr.vercel.app/${naddr}`;

        window.open(nostviewer, "_blank", "noreferrer");
        break;
      case 11:
        //open in nostviewer
        const nostrapp = `https://nostrapp.link/a/${naddr}`;

        window.open(nostrapp, "_blank", "noreferrer");
        break;
    }
  };
</script>

<DropdownMenu {menuTexts} {handleSelectItem}>
  <TriggerIcon size={iconSize} class="min-w-[{iconSize}px] {iconClass}" />
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
      {tieKey ? getRelaysById(note.id, tieKey).join(", ") : ""}
    </div>
  </div></Dialog
>
