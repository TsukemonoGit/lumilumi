<script lang="ts">
  import { toastSettings } from "$lib/stores/stores";
  import { Copy, Ellipsis, SquareArrowOutUpRight } from "lucide-svelte";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { goto } from "$app/navigation";
  import { t as _ } from "@konemono/svelte5-i18n";

  interface Props {
    encodedId: string;
    indexes?: number[];
    TriggerIcon?: any;
    iconSize?: number;
    iconClass?: string;
  }

  let {
    encodedId,
    indexes = undefined,
    TriggerIcon = Ellipsis,
    iconSize = 20,
    iconClass = "",
  }: Props = $props();

  const menuGroups = $derived.by(() => {
    const copyGroup = [
      { text: $_("menu.copy.nevent"), icon: Copy, action: "copyId" },
    ];

    const externalGroup = [
      {
        text: $_("menu.external.njump"),
        icon: SquareArrowOutUpRight,
        action: "njump",
      },
    ];

    const filterItems = (items: typeof copyGroup | typeof externalGroup) =>
      indexes ? items.filter((_, idx) => indexes.includes(idx)) : items;

    return [
      { label: $_("menu.group.copy"), items: filterItems(copyGroup) },
      externalGroup.length > 0
        ? {
            label: $_("menu.group.external"),
            items: filterItems(externalGroup),
          }
        : null,
    ].filter(Boolean) as { label: string; items: typeof copyGroup }[];
  });

  const handleSelectItem = async (action: string) => {
    switch (action) {
      case "copyId":
        try {
          await navigator.clipboard.writeText(encodedId);
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
      case "njump":
        window.open(`https://njump.me/${encodedId}`, "_blank", "noreferrer");
        break;
    }
  };
</script>

<DropdownMenu {menuGroups} {handleSelectItem}>
  <TriggerIcon size={iconSize} class="min-w-[{iconSize}px] {iconClass}" />
</DropdownMenu>
