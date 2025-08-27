<script lang="ts">
  import { toastSettings } from "$lib/stores/stores";
  import { Copy, Ellipsis, SquareArrowOutUpRight } from "lucide-svelte";

  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { goto } from "$app/navigation";
  import { t as _ } from "@konemono/svelte5-i18n";
  interface Props {
    encodedId: string;
    indexes?: number[] | undefined;
    TriggerIcon?: any;
    iconSize?: number;
    iconClass?: string;
  }

  const {
    encodedId,
    indexes = undefined,
    TriggerIcon = Ellipsis,
    iconSize = 20,
    iconClass = "",
  }: Props = $props();

  const menuTexts = $derived.by(() => {
    let menu = [
      {
        text: `${$_("menu.copy.nevent")}`,
        icon: Copy,
        num: 3,
      },

      { text: `${$_("menu.njump")}`, icon: SquareArrowOutUpRight, num: 1 },
    ];

    if (indexes !== undefined) {
      menu = menu.filter((item) => indexes.includes(item.num));
    }
    return menu;
  });

  const handleSelectItem = async (index: number) => {
    switch (menuTexts[index].num) {
      case 1:
        //open in njump

        const url = `https://njump.me/${encodedId}`;

        window.open(url, "_blank", "noreferrer");
        break;

      case 3:
        //Copy EventID
        try {
          await navigator.clipboard.writeText(encodedId);
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
        //Goto encodedId page
        goto(`/${encodedId}`);
        break;
    }
  };
</script>

<DropdownMenu {menuTexts} {handleSelectItem}>
  <TriggerIcon size={iconSize} class="min-w-[{iconSize}px] {iconClass}" />
</DropdownMenu>
