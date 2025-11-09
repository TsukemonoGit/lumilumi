<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { formatUrl } from "$lib/func/util";
  import { modalState, toastSettings } from "$lib/stores/stores";
  import {
    Copy,
    FileJson2,
    SquareArrowOutUpRight,
    RadioTower,
    Share,
  } from "lucide-svelte";
  import ModalRelayInfo from "./kindEvents/EventCard/ModalRelayInfo.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import type { Snippet } from "svelte";
  import type { Nip11 } from "nostr-typedef";

  interface Props {
    url: string;
    zIndex: number;
    children: Snippet;
    relayInfo?: Nip11.RelayInfo;
  }

  let { url, zIndex, children, relayInfo }: Props = $props();

  let encodedUrl = encodeURIComponent(url);

  const menuGroups = $derived([
    {
      label: $_("menu.group.view"),
      items: [
        {
          text: $_("menu.view.relayTimeline"),
          icon: RadioTower,
          action: "relayTimeline",
        },
        ...(relayInfo
          ? [{ text: $_("menu.view.json"), icon: FileJson2, action: "json" }]
          : []),
      ],
    },
    {
      label: $_("menu.group.copy"),
      items: [
        { text: $_("menu.copy.relayURL"), icon: Copy, action: "copyRelay" },
        { text: $_("menu.copy.sharelink"), icon: Share, action: "share" },
      ],
    },
    {
      label: $_("menu.group.external"),
      items: [
        {
          text: $_("menu.external.relayHtml"),
          icon: SquareArrowOutUpRight,
          action: "openRelay",
        },
        {
          text: $_("menu.external.nostr-watch"),
          icon: SquareArrowOutUpRight,
          action: "nostrWatch",
        },
      ],
    },
  ]);

  const handleSelectItem = async (action: string) => {
    try {
      const hostname = new URL(url).hostname;

      switch (action) {
        case "json":
          $modalState = {
            isOpen: true,
            component: ModalRelayInfo,
            props: { relayInfo },
          };
          break;

        case "nostrWatch":
          window.open(
            `https://legacy.nostr.watch/relay/${hostname}`,
            "_blank",
            "noreferrer"
          );
          break;

        case "copyRelay":
          try {
            await navigator.clipboard.writeText(url);
            $toastSettings = {
              title: "Success",
              description: "Copied to clipboard",
              color: "bg-green-500",
            };
          } catch (e: any) {
            $toastSettings = {
              title: "Error",
              description: "Failed to copy",
              color: "bg-orange-500",
            };
          }
          break;

        case "openRelay":
          window.open(formatUrl(url), "_blank", "noreferrer");
          break;

        case "relayTimeline":
          goto(`/relay/${encodedUrl}`);
          break;

        case "share":
          const shareData = {
            title: "",
            url: `${page.url.origin}/relay/${encodedUrl}`,
          };
          try {
            await navigator.share(shareData);
          } catch (e: any) {
            $toastSettings = {
              title: "Error",
              description: "Failed to share",
              color: "bg-orange-500",
            };
          }
          break;
      }
    } catch {
      $toastSettings = {
        title: "Error",
        description: "relay encode error",
        color: "bg-orange-500",
      };
    }
  };
</script>

<DropdownMenu {menuGroups} {zIndex} {handleSelectItem}>
  {@render children?.()}
</DropdownMenu>
