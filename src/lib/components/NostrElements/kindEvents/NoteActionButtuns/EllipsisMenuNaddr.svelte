<script lang="ts">
  import { toastSettings } from "$lib/stores/stores";
  import {
    Copy,
    Ellipsis,
    SquareArrowOutUpRight,
    Smile,
    Tv,
    Squirrel,
  } from "lucide-svelte";

  import * as nip19 from "nostr-tools/nip19";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { writable, type Writable } from "svelte/store";
  interface Props {
    naddr: string | undefined;
    indexes?: number[] | undefined;
    TriggerIcon?: any;
    iconSize?: number;
    iconClass?: string;
  }

  const {
    naddr,
    indexes = undefined,
    TriggerIcon = Ellipsis,
    iconSize = 20,
    iconClass = "",
  }: Props = $props();

  const dialogOpen: Writable<boolean> = writable(false);

  const decodeNaddr = (str: string | undefined) => {
    if (str === undefined) return undefined;
    try {
      const decoded = nip19.decode(str);
      if (decoded.type === "naddr") {
        return decoded.data as nip19.AddressPointer;
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  };

  const menuTexts = $derived.by(() => {
    const naddrpointer = decodeNaddr(naddr);
    let menu = [
      {
        text: `${$_("menu.copy.naddr")}`,
        icon: Copy,
        num: 3,
      },

      { text: `${$_("menu.njump")}`, icon: SquareArrowOutUpRight, num: 1 },

      //replaceable のすとびうあのリンク

      {
        text: `${$_("menu.nostviewstr")}`,
        icon: Squirrel,
        num: 10,
      },
    ];

    //30030 emojitoリンク
    if (naddrpointer?.kind === 30030) {
      menu.push({ text: `${$_("menu.emoji")}`, icon: Smile, num: 5 });
    }

    //30311 zap.streamリンク
    if (naddrpointer?.kind === 30311) {
      menu.push({ text: `${$_("menu.stream")}`, icon: Tv, num: 9 });
    }

    if (indexes !== undefined) {
      menu = menu.filter((item) => indexes.includes(item.num));
    }
    return menu;
  });

  const handleSelectItem = async (index: number) => {
    if (!naddr) {
      return;
    }
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

      case 5:
        //open in emojito
        const emojito = `https://emojito.meme/a/${naddr}`;

        window.open(emojito, "_blank", "noreferrer");
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
    }
  };
</script>

<DropdownMenu {menuTexts} {handleSelectItem}>
  <TriggerIcon size={iconSize} class="min-w-[{iconSize}px] {iconClass}" />
</DropdownMenu>
