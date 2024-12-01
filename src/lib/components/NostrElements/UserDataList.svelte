<script lang="ts">
  import { run } from "svelte/legacy";

  import {
    getMetadataList,
    type MetadataList,
    type UserData,
  } from "$lib/func/nostr";
  import { UserPlus } from "lucide-svelte";
  import type { EventPacket } from "rx-nostr";
  import type { QueryKey } from "@tanstack/svelte-query";
  import Popover from "../Elements/Popover.svelte";

  let inputMetadata = $state("");

  interface Props {
    viewMetadataList?: (bool: boolean) => void;
    handleClickUser: any;
  }

  let { viewMetadataList = $bindable(), handleClickUser }: Props = $props();

  let metadataInput: HTMLInputElement | undefined = $state();

  //--------------userlist
  let metadataList: MetadataList = $state({});

  function setMetadataList() {
    try {
      const metadataStr = localStorage.getItem("metadata");
      let metadataQueryData: [QueryKey, EventPacket][] = metadataStr
        ? JSON.parse(metadataStr)
        : [];
      metadataList = getMetadataList(metadataQueryData);
    } catch (error) {}
  }
  let onOpenStateChange = (bool: boolean) => {
    if (bool) {
      setMetadataList();
    }
  };
  // $effect(() => {
  //   if (viewMetadataList) {
  //     untrack(() => {
  //       setMetadataList();
  //     });
  //   }
  // });

  function checkUserInput(inputMetadata: string, arg1: UserData) {
    if (inputMetadata === "") {
      return true;
    }
    if (
      (arg1.name &&
        arg1.name.toLowerCase().includes(inputMetadata.toLowerCase())) ||
      (arg1.display_name &&
        arg1.display_name
          .toLowerCase()
          .includes(inputMetadata.toLowerCase())) ||
      (arg1.nip05 &&
        arg1.nip05.toLowerCase().includes(inputMetadata.toLowerCase())) ||
      (arg1.petname &&
        arg1.petname.toLowerCase().includes(inputMetadata.toLowerCase()))
    ) {
      return true;
    }
    return false;
  }
</script>

<Popover
  ariaLabel="user datalist"
  bind:openPopover={viewMetadataList}
  {onOpenStateChange}
>
  <UserPlus size="20" class={"w-12 stroke-magnum-600 "} />

  <!--metadataList-->

  {#snippet popoverContent()}
    <div
      class="max-w-full w-[600px] rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2"
    >
      <input
        bind:this={metadataInput}
        type="text"
        class="h-8 w-full m-2 rounded-md text-magnum-100 border-2
           border-magnum-400"
        bind:value={inputMetadata}
      />
      <div class="max-h-40 overflow-y-auto">
        {#each Object.entries(metadataList) as [pubkey, profile], index}
          {#if checkUserInput(inputMetadata, profile)}
            <button
              aria-label={`Select profile ${profile.display_name || profile.name || pubkey}`}
              onclick={() => handleClickUser(pubkey)}
              class="rounded-md border m-0.5 p-2 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
              >{#if profile.petname}
                📛{profile.petname}
              {:else}{profile.display_name ?? ""}@{profile.name ?? ""}{/if}
            </button>
          {/if}
        {/each}
      </div>
    </div>
  {/snippet}
</Popover>
