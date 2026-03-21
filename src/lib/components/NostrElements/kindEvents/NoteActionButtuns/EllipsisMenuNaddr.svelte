<script lang="ts">
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
  import { addToast } from "$lib/components/Elements/Toast.svelte";
  import type { MenuItem } from "$lib/types";

  interface Props {
    naddr: string | undefined;
    indexes?: number[] | undefined;
    TriggerIcon?: any;
    iconSize?: number;
    iconClass?: string;
  }

  let {
    naddr,
    indexes = undefined,
    TriggerIcon = Ellipsis,
    iconSize = 20,
    iconClass = "",
  }: Props = $props();

  const decodeNaddr = (str: string | undefined) => {
    if (!str) return undefined;
    try {
      const decoded = nip19.decode(str);
      if (decoded.type === "naddr") return decoded.data as nip19.AddressPointer;
    } catch {}
    return undefined;
  };
  let naddrpointer = $derived(decodeNaddr(naddr));
  let menuGroups = $derived.by(() => {
    const actionItems: MenuItem[] = [];

    const copyGroup = [
      { text: $_("menu.copy.naddr"), icon: Copy, action: "copyNaddr" },
    ];

    const externalGroup = [
      {
        text: $_("menu.external.nostviewstr"),
        icon: Squirrel,
        action: "nostviewstr",
      },
      {
        text: $_("menu.external.njump"),
        icon: SquareArrowOutUpRight,
        action: "njump",
      },
    ];

    if (naddrpointer?.kind === 30030) {
      externalGroup.push({
        text: $_("menu.external.emoji"),
        icon: Smile,
        action: "emojito",
      });
    }

    if (naddrpointer?.kind === 30311) {
      externalGroup.push({
        text: $_("menu.external.stream"),
        icon: Tv,
        action: "zapStream",
      });
    }

    const filterItems = (items: typeof copyGroup | typeof externalGroup) =>
      indexes ? items.filter((_, idx) => indexes.includes(idx)) : items;

    const groups = [
      { label: $_("menu.group.copy"), items: filterItems(copyGroup) },
      ...(actionItems.length > 0
        ? [{ label: $_("menu.group.action"), items: actionItems }]
        : []),
      { label: $_("menu.group.external"), items: filterItems(externalGroup) },
    ];

    return groups;
  });

  const handleSelectItem = async (action: string) => {
    if (!naddr) return;

    switch (action) {
      case "copyNaddr":
        try {
          await navigator.clipboard.writeText(naddr);
          addToast({
            data: {
              title: $_("toast.success"),
              description: $_("toast.copied_clipboard"),
              color: "bg-green-500",
            },
          });
        } catch {
          addToast({
            data: {
              title: $_("toast.error"),
              description: $_("toast.failed_copy"),
              color: "bg-orange-500",
            },
          });
        }
        break;
      case "njump":
        window.open(`https://njump.me/${naddr}`, "_blank", "noreferrer");
        break;
      case "emojito":
        window.open(`https://emojito.meme/a/${naddr}`, "_blank", "noreferrer");
        break;
      case "zapStream":
        window.open(`https://zap.stream/${naddr}`, "_blank", "noreferrer");
        break;
      case "nostviewstr":
        window.open(
          `https://nostviewstr.vercel.app/${naddr}`,
          "_blank",
          "noreferrer",
        );
        break;
    }
  };
</script>

<DropdownMenu {menuGroups} {handleSelectItem}>
  <TriggerIcon size={iconSize} class="min-w-[{iconSize}px] {iconClass}" />
</DropdownMenu>
