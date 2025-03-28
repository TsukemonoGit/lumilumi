<script lang="ts">
  import { loginUser, toastSettings } from "$lib/stores/stores";
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

  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { _ } from "svelte-i18n";
  import { locale } from "svelte-i18n";
  import { page } from "$app/state";
  import type { ChannelData } from "$lib/types";
  import { translateText } from "$lib/func/util";
  import { writable, type Writable } from "svelte/store";
  import ModalJson from "$lib/components/ModalJson.svelte";

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

      { text: `${$_("menu.sharelink")}`, icon: Share, num: 7 },
    ];

    //NIP-70
    if (
      !(note.tags.find((tag) => tag[0] === "-") && note.pubkey !== $loginUser)
    ) {
      menu.push({ text: `${$_("menu.broadcast")}`, icon: Radio, num: 6 });
    }

    if (indexes !== undefined) {
      menu = menu.filter((item) => indexes.includes(item.num));
    }
    return menu;
  });

  const handleSelectItem = async (index: number) => {
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
        // setTimeout(() => {
        //   slicedEvent.update((value) => value);
        //   console.log("こうしんしたよ");
        // }, 1000);
        break;
      case 7:
        //Share link
        const shareData = {
          title: `【Channel】${channelData.name}`,
          text: channelData.about,
          url: `${page.url.origin}/channel/${nevent}`,
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
  };

  let nevent: string | undefined = $derived.by(() => {
    if (!note) {
      return undefined;
    }
    try {
      const eventpointer: nip19.EventPointer = {
        id: note.id,
        relays: tieKey ? getRelaysById(note.id, tieKey) : [],
        author: note.pubkey,
        kind: note.kind,
      };
      return nip19.neventEncode(eventpointer);
    } catch {
      return undefined;
    }
  });
</script>

<DropdownMenu {menuTexts} {handleSelectItem}>
  <Ellipsis size="20" />
</DropdownMenu>

<!--JSON no Dialog-->
<ModalJson bind:dialogOpen {note} {tieKey} />
