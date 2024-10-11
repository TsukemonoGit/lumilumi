<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import {
    loginUser,
    nowProgress,
    queryClient,
    showImg,
    toastSettings,
  } from "$lib/stores/stores";
  import Avatar from "svelte-boring-avatars";
  import UserAvatar from "../Elements/UserAvatar.svelte";
  import {
    Copy,
    FileJson2,
    SquareArrowOutUpRight,
    User,
    RefreshCcw,
    ChevronRight,
    EyeOff,
    Zap,
    Repeat2,
    SmilePlus,
    Slash,
  } from "lucide-svelte";
  import { nip19 } from "nostr-tools";
  import { goto } from "$app/navigation";
  import { splitHexColorString, userMuteStatus } from "$lib/func/util";
  import type { Profile, UserMuteStatus } from "$lib/types";
  import Dialog from "./Dialog.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { getRelaysById } from "$lib/func/nostr";
  import Popover from "./Popover.svelte";
  import UserProfile from "./UserProfile.svelte";
  import { _ } from "svelte-i18n";
  import { writable } from "svelte/store";

  import UserMuteMenu from "./UserMuteMenu.svelte";

  export let pubkey: string;
  export let size: number;
  export let metadata: Nostr.Event | undefined;
  export let displayMenu: boolean = true;
  export let depth: number;
  export let tieKey: string | undefined;
  let dialogOpen: any;

  const baseMenuTexts = [
    { text: `${$_("menu.userPage")}`, icon: User, num: 0 },
    { text: `${$_("menu.copy.pubkey")}`, icon: Copy, num: 1 },
    { text: `${$_("menu.njump")}`, icon: SquareArrowOutUpRight, num: 3 },
    { text: `${$_("menu.updateProfile")}`, icon: RefreshCcw, num: 4 },
  ];

  const menuTexts = [
    ...baseMenuTexts,
    ...(metadata
      ? [{ text: `${$_("menu.json")}`, icon: FileJson2, num: 2 }]
      : []),
  ];

  const getProfile = (ev: Nostr.Event | undefined): Profile | undefined => {
    if (!ev) return undefined;
    try {
      return JSON.parse(ev.content);
    } catch {
      return undefined;
    }
  };
  $: profile = getProfile(metadata);
  $: url = profile?.picture;
  const title = writable<string>("");
  $: if (profile && profile.name) {
    $title = `@${profile.name}`;
  }
  let encodedPubkey: string | undefined = undefined;
  $: if (pubkey) {
    try {
      encodedPubkey = nip19.npubEncode(pubkey);
    } catch {
      encodedPubkey = undefined;
    }
  }

  const handleSelectItem = async (index: number) => {
    switch (index) {
      case 0:
        if (encodedPubkey) {
          goto(`/${encodedPubkey}`);
        }
        break;
      case 1:
        try {
          if (encodedPubkey) {
            await navigator.clipboard.writeText(encodedPubkey);
            $toastSettings = {
              title: "Success",
              description: "Copied to clipboard",
              color: "bg-green-500",
            };
          } else {
            throw new Error("No encoded pubkey");
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
        $dialogOpen = true;
        break;
      case 3:
        if (encodedPubkey) {
          const url = `https://njump.me/${encodedPubkey}`;
          window.open(url, "_blank", "noreferrer");
        }
        break;
      case 4:
        $nowProgress = true;
        const key: QueryKey = ["metadata", pubkey];
        $queryClient.invalidateQueries({ queryKey: key });
        setTimeout(() => {
          $nowProgress = false;
        }, 1000);
        break;
    }
  };
</script>

{#if !displayMenu}
  <!-- <div title={$title}> -->
  {#if $showImg && url && url !== ""}
    <UserAvatar {url} name={pubkey} {pubkey} {size} title={$title} />
  {:else}
    <Avatar
      {size}
      name={pubkey}
      variant="beam"
      colors={splitHexColorString(pubkey)}
    />
  {/if}
  <!-- </div> -->
{:else}
  <Popover ariaLabel="user profile">
    {#if $showImg && url && url !== ""}
      <UserAvatar {url} name={pubkey} {pubkey} {size} title={$title} />
    {:else}
      <Avatar
        {size}
        name={pubkey}
        variant="beam"
        colors={splitHexColorString(pubkey)}
      />
    {/if}
    <div slot="popoverContent" class="w-[24rem] max-w-full">
      <UserProfile {pubkey} bannerHeight={80} iconSize={60} {depth} {tieKey} />

      <div
        class="flex flex-col flex-wrap divide-y divide-zinc-500 bg-zinc-800 border border-zinc-100 rounded-md mt-2"
      >
        <div class="text-zinc-300 font-bold pl-2 text-md py-2">User Menu</div>

        {#each menuTexts as { icon: Icon, text, num }}
          <button
            on:click={() => handleSelectItem(num)}
            class="flex text-magnum-400
     font-medium leading-none hover:bg-magnum-500/25 focus:bg-magnum-700/25 align-middle"
            ><div
              class="inline-flex rounded-full text-sm my-auto items-center py-1"
            >
              <Icon class="mx-2 my-auto" />{text}
            </div></button
          >
        {/each}
        {#if pubkey !== $loginUser}
          <UserMuteMenu {pubkey}>
            <div
              class="flex text-magnum-400
            font-medium leading-none hover:bg-magnum-500/25 focus:bg-magnum-700/25 align-middle justify-between items-center"
            >
              <div
                class="inline-flex rounded-full text-sm my-auto items-center py-1"
              >
                <EyeOff class="mx-2 my-auto" />MUTE
              </div>
              <ChevronRight />
            </div></UserMuteMenu
          >{/if}
      </div>
    </div></Popover
  >

  <Dialog bind:open={dialogOpen}>
    <div slot="main">
      <h2 class="m-0 text-lg font-medium">EVENT JSON</h2>
      <div
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[30vh]"
      >
        {JSON.stringify(metadata, null, 2)}
      </div>
      <h2 class="mt-1 text-lg font-medium">User Data</h2>
      <div
        class=" overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[25vh]"
      >
        {#if profile}
          {#each Object.entries(profile) as [data, index]}
            <div class="flex flex-col py-1">
              <div class="font-bold whitespace-pre-wrap break-wards">
                {data}
              </div>
              <div class="ml-2 whitespace-pre-wrap break-all">
                {profile[data]}
              </div>
            </div>
          {/each}
        {/if}
      </div>
      <h2 class="mt-1 text-lg font-medium">Seen on</h2>
      <div class="break-words whitespace-pre-wrap">
        {metadata && tieKey
          ? getRelaysById(metadata.id, tieKey).join(", ")
          : ""}
      </div>
    </div>
  </Dialog>
{/if}
