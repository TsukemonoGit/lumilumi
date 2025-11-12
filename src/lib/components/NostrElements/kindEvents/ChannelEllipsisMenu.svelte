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
  import type { ChannelData, MenuGroup, MenuItem } from "$lib/types";
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

  function makeMenuItem(
    textKey: string,
    icon: typeof Copy,
    action: string
  ): MenuItem {
    return { text: $_(textKey), icon, action };
  }

  let menuGroups: MenuGroup[] = $derived.by(() => {
    const viewGroup: MenuItem[] = note
      ? [
          makeMenuItem("menu.view.json", FileJson2, "viewJson"),
          makeMenuItem("channel.menu.open", Tv, "openChannel"),
        ]
      : [];

    const copyGroup: MenuItem[] = [
      makeMenuItem("menu.copy.nevent", Copy, "copyEvent"),
      channelData && makeMenuItem("menu.copy.sharelink", Share, "shareLink"),
    ].filter(Boolean) as MenuItem[];

    const externalGroup: MenuItem[] = [
      makeMenuItem("menu.external.njump", SquareArrowOutUpRight, "njump"),
    ];

    const actionGroup: MenuItem[] = [];
    const selfPubkey = lumiSetting.get().pubkey;
    if (channelData) {
      actionGroup.push(
        makeMenuItem("channel.menu.edit", SquarePen, "editList")
      );
    }
    if (note) {
      const blocked = note.tags.find((t) => t[0] === "-");
      const isSelf = note.pubkey === selfPubkey;

      if (!(blocked && !isSelf)) {
        actionGroup.push(
          makeMenuItem("menu.action.broadcast", Radio, "broadcast")
        );
      }
      if (isSelf) {
        actionGroup.unshift(
          makeMenuItem("menu.action.editChannelInfo", SquarePen, "editInfo")
        );
      }
    }

    const filterItems = (items: MenuItem[]) =>
      indexes ? items.filter((_, i) => indexes.includes(i)) : items;

    function buildGroup(labelKey: string, items: MenuItem[]) {
      return items.length
        ? { label: $_(labelKey), items: filterItems(items) }
        : null;
    }

    return [
      buildGroup("menu.group.view", viewGroup),
      buildGroup("menu.group.copy", copyGroup),
      buildGroup("menu.group.action", actionGroup),
      buildGroup("menu.group.external", externalGroup),
    ].filter(Boolean) as MenuGroup[];
  });

  async function handleSelectItem(action: string) {
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
  }
</script>

<DropdownMenu {menuGroups} {handleSelectItem}>
  <Ellipsis size="20" />
</DropdownMenu>

{#if note && channelData}
  <EditChannelInfo {editChannelDataOpen} {heyaId} {note} {channelData} />
{/if}

<EditChannelList bind:editChannelListOpen {heyaId} />
