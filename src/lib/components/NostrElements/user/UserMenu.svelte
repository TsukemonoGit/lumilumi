<script lang="ts">
  import {
    loginUser,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import {
    ChevronRight,
    Copy,
    EyeOff,
    FileJson2,
    RefreshCcw,
    User,
    Radio,
    Share,
  } from "lucide-svelte";
  import UserMuteMenu from "./UserMuteMenu.svelte";
  import { goto } from "$app/navigation";
  import { _ } from "svelte-i18n";

  import type { QueryKey } from "@tanstack/svelte-query";
  import * as Nostr from "nostr-typedef";
  import type { Profile } from "$lib/types";
  import { getRelaysById, publishEvent } from "$lib/func/nostr";
  import { nip19 } from "nostr-tools";
  import { page } from "$app/state";
  import { useNip05PromiseCheck } from "$lib/func/nip05check";
  import { writable, type Writable } from "svelte/store";
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import ModalJson from "$lib/components/ModalJson.svelte";

  interface Props {
    tieKey: string | undefined;
    metadata: Nostr.Event | undefined;
    pubkey: string;
    profile: Profile | undefined;
  }

  let { tieKey, metadata, pubkey, profile }: Props = $props();

  // svelte-ignore non_reactive_update
  let dialogOpen: Writable<boolean> = writable(false);
  let encodedPubkey = $derived.by(() => {
    if (pubkey) {
      try {
        return nip19.npubEncode(pubkey);
      } catch {
        return undefined;
      }
    }
  });

  const baseMenuTexts = [
    { text: `${$_("menu.userPage")}`, icon: User, num: 0 },
    { text: `${$_("menu.copy.pubkey")}`, icon: Copy, num: 1 },
    // { text: `${$_("menu.njump")}`, icon: SquareArrowOutUpRight, num: 3 },
    { text: `${$_("menu.updateProfile")}`, icon: RefreshCcw, num: 4 },
  ];

  let menuTexts = $derived([
    ...(page.url.pathname === `/${encodedPubkey}`
      ? baseMenuTexts.filter((item) => item.num !== 0) // "userPage" を削除
      : baseMenuTexts),
    ...(metadata
      ? [
          { text: $_("menu.broadcast"), icon: Radio, num: 5 },
          { text: `${$_("menu.json")}`, icon: FileJson2, num: 2 },
        ]
      : []),
    { text: `${$_("menu.sharelink")}`, icon: Share, num: 7 },
  ]);

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
        queryClient.invalidateQueries({ queryKey: key });
        setTimeout(() => {
          $nowProgress = false;
        }, 1000);
        break;
      case 5:
        //bloadcast metadata
        if (metadata) {
          publishEvent(metadata);
          $nowProgress = true;
        }
        setTimeout(() => {
          //処理してるよのためだけの
          $nowProgress = false;
        }, 1000);
        break;
      case 7:
        //リンクの共有
        //Share link
        if (!encodedPubkey) {
          return;
        }
        $nowProgress = true;
        let urlData: string = encodedPubkey;
        const nip05 = profile?.nip05;
        if (nip05) {
          const data: { result: boolean; error?: string } | undefined =
            queryClient.getQueryData(["nip05", pubkey, nip05.toLowerCase()]);
          if (data && data.result) {
            urlData = nip05;
          } else {
            const data = await useNip05PromiseCheck(nip05, pubkey);
            if (data) {
              queryClient.setQueryData(
                ["nip05", pubkey, nip05.toLowerCase()],
                data
              );
              if (data.result) {
                urlData = nip05;
              }
            }
          }
        }
        $nowProgress = false;
        const shareData = {
          //title: "",
          text: "",
          url: `${page.url.origin}/${urlData}`,
        };

        try {
          await navigator.share(shareData);
          // await navigator.clipboard.writeText(
          //   `${page.url.origin}/${replaceable ? naddr : nevent}`
          // );
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
  };
</script>

{#each menuTexts as { icon: Icon, text, num }}
  <button
    onclick={() => handleSelectItem(num)}
    class="
     flex
     font-medium leading-none bg-neutral-800 text-magnum-300 hover:bg-magnum-500/25 active:opacity-50 disabled:opacity-15 py-1 items-center"
  >
    <Icon class="mx-2 my-auto" />{text}
  </button>
{/each}
{#if $loginUser && pubkey !== $loginUser}
  <UserMuteMenu {pubkey}>
    <div
      class="
    flex
    font-medium leading-none bg-neutral-800 text-magnum-300 hover:bg-magnum-500/25 active:opacity-50 disabled:opacity-15 py-1 items-center"
    >
      <div class="inline-flex rounded-full text-sm my-auto items-center">
        <EyeOff class="mx-2 my-auto" />MUTE
      </div>
      <ChevronRight class="ml-auto" />
    </div></UserMuteMenu
  >{/if}

{#if metadata}
  <ModalJson bind:dialogOpen note={metadata} {profile} {tieKey} />{/if}
<!-- <Dialog bind:open={dialogOpen}>
  {#snippet main()}
    <div>
      <h2 class="m-0 text-lg font-medium">EVENT JSON</h2>
      <div
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[30vh]"
      >
        {JSON.stringify(metadata, null, 2)}
      </div>
      <div class="my-1 break-all overflow-auto">
 
        <div class=" font-mono font-bold text-xs">{encodedPubkey}</div>
        <div class=" font-mono font-bold text-xs">{nevent}</div>
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
  {/snippet}
</Dialog> -->
