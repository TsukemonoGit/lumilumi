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
  import { publishEvent } from "$lib/func/nostr";
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
    note?: Nostr.Event;
    indexes?: number[];
    channelData?: ChannelData;
    heyaId: string;
  }

  let { note, indexes, channelData, heyaId }: Props = $props();

  let editChannelDataOpen = $state(writable(false));
  let editChannelListOpen = $state(writable(false));

  let channelLink = $derived(getChannelLink(heyaId));
  let heyaRelays = $derived(note ? getHeyaRelays(note) : []);
  let heyaNevent = $derived(
    nip19.neventEncode({ id: heyaId, relays: heyaRelays, kind: 40 })
  );

  const menuGroups = $derived.by(() => {
    // View group
    const viewGroup = note
      ? [
          { text: $_("menu.view.json"), icon: FileJson2, action: "viewJson" },
          {
            text: $_("menu.external.njump"),
            icon: SquareArrowOutUpRight,
            action: "njump",
          },
          { text: $_("channel.menu.open"), icon: Tv, action: "openChannel" },
        ]
      : [
          {
            text: $_("menu.external.njump"),
            icon: SquareArrowOutUpRight,
            action: "njump",
          },
        ];

    // Copy/Share group
    const copyGroup = [
      { text: $_("menu.copy.nevent"), icon: Copy, action: "copyEvent" },
      channelData && {
        text: $_("menu.copy.sharelink"),
        icon: Share,
        action: "shareLink",
      },
    ].filter(Boolean) as { text: string; icon: any; action: string }[];

    // Action group
    const actionGroup: { text: string; icon: any; action: string }[] = [];

    if (note) {
      if (
        !(
          note.tags.find((t) => t[0] === "-") &&
          note.pubkey !== lumiSetting.get().pubkey
        )
      ) {
        actionGroup.push({
          text: $_("menu.action.broadcast"),
          icon: Radio,
          action: "broadcast",
        });
      }

      if (note.pubkey === lumiSetting.get().pubkey) {
        actionGroup.unshift({
          text: $_("menu.action.editChannelInfo"),
          icon: SquarePen,
          action: "editInfo",
        });
      }
    }

    if (channelData) {
      actionGroup.push({
        text: $_("channel.menu.edit"),
        icon: SquarePen,
        action: "editList",
      });
    }

    const filterItems = (
      items: typeof viewGroup | typeof copyGroup | typeof actionGroup
    ) => (indexes ? items.filter((_, idx) => indexes.includes(idx)) : items);

    return [
      viewGroup.length > 0
        ? { label: $_("menu.group.view"), items: filterItems(viewGroup) }
        : null,
      copyGroup.length > 0
        ? { label: $_("menu.group.copy"), items: filterItems(copyGroup) }
        : null,
      actionGroup.length > 0
        ? { label: $_("menu.group.action"), items: filterItems(actionGroup) }
        : null,
    ].filter(Boolean) as { label: string; items: typeof viewGroup }[];
  });

  const handleSelectItem = async (action: string) => {
    switch (action) {
      case "viewJson":
        if (note)
          $modalState = { isOpen: true, component: ModalJson, props: { note } };
        break;
      case "njump":
        window.open(`https://njump.me/${heyaNevent}`, "_blank", "noreferrer");
        break;
      case "openChannel":
        goto(channelLink);
        break;
      case "copyEvent":
        try {
          await navigator.clipboard.writeText(heyaNevent ?? "");
          $toastSettings = {
            title: $_("toast.success"),
            description: $_("toast.copied_clipboard"),
            color: "bg-green-500",
          };
        } catch {
          $toastSettings = {
            title: $_("toast.error"),
            description: $_("toast.failed_copy"),
            color: "bg-orange-500",
          };
        }
        break;
      case "editList":
        $editChannelListOpen = true;
        break;
      case "broadcast":
        if (note) publishEvent(note);
        break;
      case "shareLink":
        if (channelData) {
          const shareData = {
            title: `【Channel】${channelData.name}`,
            text: channelData.about,
            url: `${page.url.origin}/channel/${heyaNevent}`,
          };
          try {
            await navigator.share(shareData);
          } catch {
            $toastSettings = {
              title: $_("toast.error"),
              description: $_("toast.failed_copy"),
              color: "bg-orange-500",
            };
          }
        }
        break;
      case "editInfo":
        $editChannelDataOpen = true;
        break;
    }
  };
</script>

<DropdownMenu {menuGroups} {handleSelectItem}>
  <Ellipsis size="20" />
</DropdownMenu>
{#if note && channelData}
  <EditChannelInfo {editChannelDataOpen} {heyaId} {note} {channelData} />{/if}
<EditChannelList bind:editChannelListOpen {heyaId} />
