<script lang="ts">
  import { run } from "svelte/legacy";

  import { slicedEvent, toastSettings } from "$lib/stores/stores";
  import {
    Copy,
    Ellipsis,
    FileJson2,
    SquareArrowOutUpRight,
    Radio,
    Share,
  } from "lucide-svelte";

  import * as Nostr from "nostr-typedef";
  import { getRelaysById, publishEvent } from "$lib/func/nostr";
  import { nip19 } from "nostr-tools";
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { _ } from "svelte-i18n";
  import { locale } from "svelte-i18n";
  import { page } from "$app/stores";
  import type { ChannelData } from "$lib/types";
  import { translateText } from "$lib/func/util";
  import { writable, type Writable } from "svelte/store";
  import { untrack } from "svelte";
  interface Props {
    note: Nostr.Event;
    indexes?: number[] | undefined;
    channelData: ChannelData;
    tieKey: string | undefined;
  }

  let { note, indexes = undefined, channelData, tieKey }: Props = $props();

  // svelte-ignore non_reactive_update
  let dialogOpen: Writable<boolean> = writable(false);

  let menuTexts = $derived.by(() => {
    let menu = [
      {
        text: $_("menu.copy.nevent"),
        icon: Copy,
        num: 3,
      },
      { text: `${$_("menu.json")}`, icon: FileJson2, num: 0 },
      { text: `${$_("menu.njump")}`, icon: SquareArrowOutUpRight, num: 1 },
      //{ text: `${$_("menu.translate")}`, icon: Earth, num: 2 },
      // { text: `${$_("menu.note")}`, icon: Notebook, num: 4 },
      { text: `${$_("menu.broadcast")}`, icon: Radio, num: 6 },
      { text: `${$_("menu.sharelink")}`, icon: Share, num: 7 },
    ];

    if (indexes !== undefined) {
      menu = menu.filter((item) => indexes.includes(item.num));
    }
    return menu;
  });

  const handleSelectItem = async (index: number) => {
    //  console.log(menuTexts[index]);

    const naddrpointer: nip19.AddressPointer = {
      kind: note.kind,
      identifier: note.tags.find((item) => item[0] === "d")?.[1] ?? "",
      pubkey: note.pubkey,
      relays: tieKey ? getRelaysById(note.id, tieKey) : [],
    };
    const naddr = nip19.naddrEncode(naddrpointer);

    switch (menuTexts[index].num) {
      case 0:
        //view json
        $dialogOpen = true;
        break;

      case 1:
        //open in njump

        const url = `https://njump.me/${nevent}`;

        window.open(url, "_blank", "noreferrer");
        break;

      case 2:
        //Translate

        const translateUrl = `https://translate.google.com/?sl=auto&tl=${$locale}&op=translate&text=${translateText(note.content)}`;

        window.open(translateUrl, "_blank", "noreferrer");
        break;

      case 3:
        //Copy EventID
        try {
          await navigator.clipboard.writeText(nevent ?? "");
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
        //Share link
        const shareData = {
          title: `【Channel】${channelData.name}`,
          text: channelData.about,
          url: `${$page.url.origin}/channel/${nevent}`,
        };
        try {
          await navigator.share(shareData);
          // await navigator.clipboard.writeText(
          //   `${$page.url.origin}/channel/${nevent}`
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
    }
  };

  let nevent: string | undefined = $state(undefined);
  let encodedPubkey: string | undefined = $state(undefined);
  $effect(() => {
    if (note) {
      untrack(() => () => {
        try {
          encodedPubkey = nip19.npubEncode(note.pubkey);
        } catch {
          encodedPubkey = undefined;
        }
        try {
          const eventpointer: nip19.EventPointer = {
            id: note.id,
            relays: tieKey ? getRelaysById(note.id, tieKey) : [],
            author: note.pubkey,
            kind: note.kind,
          };
          nevent = nip19.neventEncode(eventpointer);
        } catch {
          nevent = undefined;
        }
      });
    }
  });
</script>

<DropdownMenu {menuTexts} {handleSelectItem}>
  <Ellipsis size="20" />
</DropdownMenu>

<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  {#snippet main()}
    <div>
      <h2 class="m-0 text-lg font-medium">EVENT JSON</h2>
      <div
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[30vh]"
      >
        {JSON.stringify(note, null, 2)}
      </div>
      <div class="my-1 break-all overflow-auto">
        <!-- <div class="text-lg font-medium">Encoded</div> -->
        <div class=" font-mono font-bold text-xs">{encodedPubkey}</div>
        <div class=" font-mono font-bold text-xs">{nevent}</div>
      </div>
      <h2 class="m-0 text-lg font-medium">Seen on</h2>
      <div class="break-words whitespace-pre-wrap">
        {tieKey ? getRelaysById(note.id, tieKey).join(", ") : ""}
      </div>
    </div>
  {/snippet}</Dialog
>
