<script lang="ts">
  import { loginUser, modalState, toastSettings } from "$lib/stores/stores";
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
  import { page } from "$app/state";
  import ModalJson from "$lib/components/ModalJson.svelte";

  interface Props {
    note: Nostr.Event;
    indexes?: number[] | undefined;
    listData: {
      dtag: string | undefined;
      title: string | undefined;
      description: string | undefined;
    };
    tieKey: string | undefined;
  }

  let { note, indexes = undefined, listData, tieKey }: Props = $props();

  // svelte-ignore non_reactive_update
  //let dialogOpen: Writable<boolean> = writable(false);

  // svelte-ignore non_reactive_update
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

    { text: `${$_("menu.sharelink")}`, icon: Share, num: 7 },
  ];

  //NIP-70
  if (
    !(note.tags.find((tag) => tag[0] === "-") && note.pubkey !== $loginUser)
  ) {
    menuTexts.push({ text: `${$_("menu.broadcast")}`, icon: Radio, num: 6 });
  }

  if (indexes !== undefined) {
    menuTexts = menuTexts.filter((item) => indexes.includes(item.num));
  }

  const handleSelectItem = async (index: number) => {
    switch (menuTexts[index].num) {
      case 0:
        //view json
        //$dialogOpen = true;
        $modalState = {
          isOpen: true,
          component: ModalJson,
          props: { note: note, tieKey: tieKey },
        };
        break;

      case 1:
        //open in njump

        const url = `https://njump.me/${naddr}`;

        window.open(url, "_blank", "noreferrer");
        break;

      case 3:
        //Copy EventID
        try {
          await navigator.clipboard.writeText(naddr ?? "");
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
        publishEvent(note);

        break;
      case 7:
        //share link
        const shareData = {
          title: `【List】${listData.title ?? listData.dtag ?? ""}`,
          text: listData.description ?? undefined,
          url: `${page.url.origin}/list/${naddr}`,
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

  let naddr: string | undefined = $derived.by(() => {
    if (!note) {
      return undefined;
    }
    try {
      const naddrpointer: nip19.AddressPointer = {
        kind: note.kind,
        identifier: note.tags.find((item) => item[0] === "d")?.[1] ?? "",
        pubkey: note.pubkey,
        relays: tieKey ? getRelaysById(note.id, tieKey) : [],
      };
      return nip19.naddrEncode(naddrpointer);
    } catch (error) {
      return undefined;
    }
  });
</script>

<DropdownMenu {menuTexts} {handleSelectItem}>
  <Ellipsis size="20" />
</DropdownMenu>

<!--JSON no Dialog
<ModalJson bind:dialogOpen {note} {tieKey} />-->
