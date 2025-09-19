<script lang="ts">
  import { modalState, toastSettings } from "$lib/stores/stores";
  import {
    Copy,
    Ellipsis,
    FileJson2,
    SquareArrowOutUpRight,
    Radio,
    Share,
    SquarePen,
    Tv,
  } from "lucide-svelte";

  import * as Nostr from "nostr-typedef";
  import { getRelaysById, publishEvent } from "$lib/func/nostr";
  import * as nip19 from "nostr-tools/nip19";

  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";

  import { page } from "$app/state";
  import type { ChannelData } from "$lib/types";
  import ModalJson from "$lib/components/ModalJson.svelte";
  import { writable } from "svelte/store";
  import EditChannelInfo from "../../../../routes/channel/EditChannelInfo.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { getChannelLink, getHeyaRelays } from "$lib/func/channel";
  import { goto } from "$app/navigation";
  import EditChannelList from "../../../../routes/channel/EditChannelList.svelte";

  interface Props {
    note: Nostr.Event; //kind40か41
    indexes?: number[] | undefined;
    channelData: ChannelData;

    heyaId: string;
  }

  let {
    note,
    indexes = undefined,
    channelData,

    heyaId,
  }: Props = $props();
  // svelte-ignore non_reactive_update
  // let dialogOpen: Writable<boolean> = writable(false);

  let menuTexts = $derived.by(() => {
    let menu = [
      {
        text: `${$_("menu.copy.nevent")}`,
        icon: Copy,
        num: 3,
      },
      { text: `${$_("menu.json")}`, icon: FileJson2, num: 0 },
      { text: `${$_("menu.njump")}`, icon: SquareArrowOutUpRight, num: 1 },

      { text: `${$_("menu.sharelink")}`, icon: Share, num: 7 },
      { icon: SquarePen, text: `${$_("channel.menu.edit")}`, num: 4 },
      { text: `${$_("channel.menu.open")}`, icon: Tv, num: 2 },
    ];

    //NIP-70
    if (
      !(
        note.tags.find((tag) => tag[0] === "-") &&
        note.pubkey !== lumiSetting.get().pubkey
      )
    ) {
      menu.push({ text: `${$_("menu.broadcast")}`, icon: Radio, num: 6 });
    }

    //
    if (note.pubkey === lumiSetting.get().pubkey) {
      menu.unshift({
        text: `${$_("menu.editChannelInfo")}`,
        icon: SquarePen,
        num: 8,
      }); //配列の先頭に挿入
    }

    if (indexes !== undefined) {
      menu = menu.filter((item) => indexes.includes(item.num));
    }
    return menu;
  });

  let editChannelDataOpen = $state(writable(false));
  let editChannelListOpen = $state(writable(false));
  let channelLink = $derived(getChannelLink(heyaId));
  let heyaRelays = $derived(getHeyaRelays(note));
  let heyaNevent = $derived(
    nip19.neventEncode({ id: heyaId, relays: heyaRelays, kind: 40 })
  );

  const handleSelectItem = async (index: number) => {
    switch (menuTexts[index].num) {
      case 0:
        //view json
        //    $dialogOpen = true;
        $modalState = {
          isOpen: true,
          component: ModalJson,
          props: { note: note },
        };
        break;

      case 1:
        //open in njump

        const url = `https://njump.me/${heyaNevent}`;

        window.open(url, "_blank", "noreferrer");
        break;
      case 2:
        //open
        goto(channelLink);
        break;

      case 3:
        //Copy EventID
        try {
          await navigator.clipboard.writeText(heyaNevent ?? "");
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
        //Edit Channel Info
        $editChannelListOpen = true;
        break;
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
          url: `${page.url.origin}/channel/${heyaNevent}`,
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
      case 8:
        //Edit Channel Info
        $editChannelDataOpen = true;
        break;
    }
  };
</script>

<DropdownMenu {menuTexts} {handleSelectItem}>
  <Ellipsis size="20" />
</DropdownMenu>

<EditChannelInfo {editChannelDataOpen} {heyaId} {note} {channelData} />
<EditChannelList bind:editChannelListOpen {heyaId} />
