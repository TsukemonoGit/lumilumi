<script lang="ts">
  import { modalState, toastSettings } from "$lib/stores/stores";
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
  import * as nip19 from "nostr-tools/nip19";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { page } from "$app/state";
  import ModalJson from "$lib/components/ModalJson.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  interface Props {
    note: Nostr.Event;
    indexes?: number[];
    listData: { dtag?: string; title?: string; description?: string };
  }

  let { note, indexes, listData }: Props = $props();

  let naddr = $derived.by(() => {
    if (!note) return undefined;
    try {
      const naddrPointer: nip19.AddressPointer = {
        kind: note.kind,
        identifier: note.tags.find((t) => t[0] === "d")?.[1] ?? "",
        pubkey: note.pubkey,
        relays: getRelaysById(note.id),
      };
      return nip19.naddrEncode(naddrPointer);
    } catch {
      return undefined;
    }
  });

  const menuGroups = $derived.by(() => {
    const viewGroup = [
      { text: $_("menu.view.json"), icon: FileJson2, action: "viewJson" },
    ];

    const copyGroup = [
      { text: $_("menu.copy.naddr"), icon: Copy, action: "copyNaddr" },
      { text: $_("menu.copy.sharelink"), icon: Share, action: "shareLink" },
    ];

    const actionGroup: { text: string; icon: any; action: string }[] = [];
    // NIP-70 条件
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
    const externalGroup = [
      {
        text: $_("menu.external.njump"),
        icon: SquareArrowOutUpRight,
        action: "njump",
      },
    ];
    // indexes 指定があればフィルタ
    const filterItems = (
      items: typeof viewGroup | typeof copyGroup | typeof actionGroup
    ) => (indexes ? items.filter((_, idx) => indexes.includes(idx)) : items);

    return [
      { label: $_("menu.group.view"), items: filterItems(viewGroup) },
      { label: $_("menu.group.copy"), items: filterItems(copyGroup) },
      actionGroup.length > 0
        ? { label: $_("menu.group.action"), items: filterItems(actionGroup) }
        : null,
      { label: $_("menu.group.external"), items: filterItems(externalGroup) },
    ].filter(Boolean) as { label: string; items: typeof viewGroup }[];
  });

  const handleSelectItem = async (action: string) => {
    switch (action) {
      case "viewJson":
        $modalState = { isOpen: true, component: ModalJson, props: { note } };
        break;

      case "njump":
        window.open(`https://njump.me/${naddr}`, "_blank", "noreferrer");
        break;

      case "copyNaddr":
        try {
          await navigator.clipboard.writeText(naddr ?? "");
          $toastSettings = {
            title: "Success",
            description: "Copied to clipboard",
            color: "bg-green-500",
          };
        } catch {
          $toastSettings = {
            title: "Error",
            description: "Failed to copy",
            color: "bg-orange-500",
          };
        }
        break;

      case "broadcast":
        publishEvent(note);
        break;

      case "shareLink":
        const shareData = {
          title: `【List】${listData.title ?? listData.dtag ?? ""}`,
          text: listData.description,
          url: `${page.url.origin}/list/${naddr}`,
        };
        try {
          await navigator.share(shareData);
        } catch {
          $toastSettings = {
            title: "Error",
            description: "Failed to share",
            color: "bg-orange-500",
          };
        }
        break;
    }
  };
</script>

<DropdownMenu {menuGroups} {handleSelectItem}>
  <Ellipsis size="20" />
</DropdownMenu>
