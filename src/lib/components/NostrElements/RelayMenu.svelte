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

  import { type Snippet } from "svelte";
  import { type Nip11 } from "nostr-typedef";

  interface Props {
    url: string;

    zIndex: number;
    children: Snippet;
    relayInfo?: Nip11.RelayInfo | undefined;
  }

  const { url, zIndex, children, relayInfo }: Props = $props();

  const encodedUrl = $derived(encodeURIComponent(url));

  // svelte-ignore non_reactive_update
  const menuTexts = [
    { text: `${$_("menu.open.relayTimeline")}`, icon: RadioTower, num: 5 },
    { text: `${$_("menu.copy.relayURL")}`, icon: Copy, num: 3 },
    ...(relayInfo !== undefined
      ? [{ text: `${$_("menu.json")}`, icon: FileJson2, num: 0 }]
      : []),
    {
      text: `${$_("menu.open.relayHtml")}`,
      icon: SquareArrowOutUpRight,
      num: 4,
    },
    {
      text: `${$_("menu.nostr-watch")}`,
      icon: SquareArrowOutUpRight,
      num: 1,
    },
    { text: `${$_("menu.sharelink")}`, icon: Share, num: 6 },
  ];

  const handleSelectItem = async (index: number) => {
    try {
      //const encodedrelay = nip19.nrelayEncode(url);
      const hostname = new URL(url).hostname;

      switch (menuTexts[index].num) {
        case 0:
          //view json
          //$dialogOpen = true;
          $modalState = {
            isOpen: true,
            component: ModalRelayInfo,
            props: { relayInfo: relayInfo },
          };

          break;

        case 1:
          //nostrWatch
          //https://legacy.nostr.watch/

          window.open(
            `https://legacy.nostr.watch/relay/${hostname}`,
            "_blank",
            "noreferrer"
          );

          // `https://nostr.watch/relay/${html.hostname}`,
          //const njumpURL = `https://njump.me/${encodedrelay}`;

          //  window.open(njumpURL, "_blank", "noreferrer");
          break;

        case 3:
          //Copy relayURL
          try {
            await navigator.clipboard.writeText(url);
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
          //open relay site

          window.open(formatUrl(url), "_blank", "noreferrer");

          break;
        case 5:
          //goto relay page

          goto(`/relay/${encodedUrl}`);
          break;
        case 6:
          //share relay page
          const shareData = {
            title: "",
            //text: "lumilumi",
            url: `${page.url.origin}/relay/${encodedUrl}`,
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
    } catch (error) {
      console.log("relay encode error");
      $toastSettings = {
        title: "Error",
        description: "relay encode error",
        color: "bg-orange-500",
      };
    }
  };
</script>

<DropdownMenu {menuTexts} {zIndex} {handleSelectItem}
  >{@render children?.()}</DropdownMenu
>
