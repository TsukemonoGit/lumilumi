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
  import { Copy, User } from "lucide-svelte";
  import { nip19 } from "nostr-tools";
  import { goto } from "$app/navigation";
  import { splitHexColorString } from "$lib/func/util";

  export let url: string | undefined;
  export let name: string | undefined;
  export let pubkey: string;
  export let size: number;

  const menuTexts = [
    { text: "Goto UserPage", icon: User, num: 0 },
    { text: "Copy Pubkey", icon: Copy, num: 1 },
  ];

  const handleSelectItem = async (index: number) => {
    console.log(menuTexts[index]);
    switch (menuTexts[index].num) {
      case 0:
        goto(`/${nip19.npubEncode(pubkey)}`);
        break;
      case 1:
        //Copy Pubkey
        try {
          await navigator.clipboard.writeText(nip19.npubEncode(pubkey));
          $toastSettings = {
            title: "Success",
            description: `Copied to clipboard`,
            color: "bg-green-500",
          };
        } catch (error: any) {
          console.error(error.message);
          $toastSettings = {
            title: "Warning",
            description: "Failed to copy",
            color: "bg-orange-500",
          };
        }

        break;
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
