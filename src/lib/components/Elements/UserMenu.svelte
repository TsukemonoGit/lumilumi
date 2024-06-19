<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import {
    loginUser,
    showImg,
    toastSettings,
    viewEventIds,
  } from "$lib/stores/stores";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import Avatar from "svelte-boring-avatars";
  import UserAvatar from "../Elements/UserAvatar.svelte";
  import { Copy, FileJson2, SquareArrowOutUpRight, User } from "lucide-svelte";
  import { nip19 } from "nostr-tools";
  import { goto } from "$app/navigation";
  import { splitHexColorString } from "$lib/func/util";
  import type { Profile } from "$lib/types";
  import Dialog from "./Dialog.svelte";
  import { getRelaysById } from "$lib/func/nostr";

  export let pubkey: string;
  export let size: number;
  export let metadata: Nostr.Event | undefined;

  let dialogOpen: any;

  const profile = (ev: Nostr.Event | undefined): Profile | undefined => {
    if (!ev) {
      return undefined;
    }
    try {
      return JSON.parse(ev.content);
    } catch (error) {
      return undefined;
    }
  };

  $: url = profile(metadata)?.picture;
  $: name = profile(metadata)?.name;
  let encodedPubkey: string | undefined = undefined;
  $: if (pubkey) {
    try {
      encodedPubkey = nip19.npubEncode(pubkey);
    } catch (error) {
      encodedPubkey = undefined;
    }
  }

  const menuTexts = metadata
    ? [
        { text: "Goto UserPage", icon: User, num: 0 },
        { text: "Copy Pubkey", icon: Copy, num: 1 },
        { text: "View Json", icon: FileJson2, num: 2 },
        { text: "Open in njump", icon: SquareArrowOutUpRight, num: 3 },
      ]
    : [
        { text: "Goto UserPage", icon: User, num: 0 },
        { text: "Copy Pubkey", icon: Copy, num: 1 },
        { text: "Open in njump", icon: SquareArrowOutUpRight, num: 3 },
      ];

  const handleSelectItem = async (index: number) => {
    console.log(menuTexts[index]);
    switch (menuTexts[index].num) {
      case 0:
        //goto usrPage
        if (encodedPubkey) {
          goto(`/${encodedPubkey}`);
        }
        break;
      case 1:
        //Copy Pubkey

        try {
          if (encodedPubkey) {
            await navigator.clipboard.writeText(encodedPubkey);
            $toastSettings = {
              title: "Success",
              description: `Copied to clipboard`,
              color: "bg-green-500",
            };
          } else {
            throw Error;
          }
        } catch (error: any) {
          console.error(error.message);
          $toastSettings = {
            title: "Warning",
            description: "Failed to copy",
            color: "bg-orange-500",
          };
        }

        break;
      case 2:
        //viewJson
        $dialogOpen = true;
        break;
      case 3:
        //njump
        if (encodedPubkey) {
          const url = `https://njump.me/${encodedPubkey}`;

          window.open(url, "_blank", "noreferrer");
        }
    }
  };
</script>

<DropdownMenu {menuTexts} {handleSelectItem}>
  {#if $showImg && url && url !== ""}
    <UserAvatar {url} name={name ?? ""} {pubkey} {size} />
  {:else}
    <Avatar
      {size}
      name={pubkey}
      variant="beam"
      colors={splitHexColorString(pubkey)}
    />
  {/if}
</DropdownMenu>

<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  <div slot="main">
    <h2 class="m-0 text-lg font-medium">EVENT JSON</h2>
    <div
      class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[30vh]"
    >
      {JSON.stringify(metadata, null, 2)}
    </div>

    <h2 class="m-0 text-lg font-medium">Seen on</h2>
    <div class="break-words whitespace-pre-wrap">
      {metadata ? getRelaysById(metadata.id).join(", ") : ""}
    </div>
  </div></Dialog
>
