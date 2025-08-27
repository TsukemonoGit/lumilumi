<script lang="ts">
  import { relayRegex2 } from "$lib/func/regex";
  import { createAccordion, melt } from "@melt-ui/svelte";
  import { ChevronDown, X } from "lucide-svelte";
  import { writable } from "svelte/store";
  import { slide } from "svelte/transition";
  import { toastSettings } from "$lib/stores/stores";

  import RelayStatusColor from "$lib/components/RelayStatusColor.svelte";
  import { untrack, type Component } from "svelte";
  import { normalizeURL } from "nostr-tools/utils";
  interface Props {
    relays?: string[];
    title: string;
    Description: Component;
    onClickSave: (relays: string[]) => void;
  }

  const { relays = [], title, Description, onClickSave }: Props = $props();

  const newRelays = writable<string[]>([...(relays ?? [])]);
  $effect(() => {
    if (relays) {
      untrack(() => newRelays.set([...relays]));
    }
  });
  const {
    elements: { content, item, trigger, root },
    helpers: { isSelected },
    states: { value },
  } = createAccordion({});

  const removeRelay = (str: string) => {
    $newRelays = $newRelays.filter((relay) => relay !== str);
  };
  let newRelayURL: string = $state("");

  const handleClickAdd = () => {
    if (!newRelayURL.trim()) {
      return;
    }
    try {
      const url = normalizeURL(newRelayURL.trim());

      console.log(url);
      if (!relayRegex2.test(url) || $newRelays.includes(url)) {
        $toastSettings = {
          title: "Error",
          description: "failed to add relay",
          color: "bg-orange-500",
        };
        return;
      } else {
        $newRelays.push(url);
        $newRelays = $newRelays;
        newRelayURL = "";
      }
    } catch (error) {
      $toastSettings = {
        title: "Error",
        description: "Invalid URL",
        color: "bg-orange-500",
      };
      return;
    }
  };
  function arraysEqual(a: string[], b: string[]): boolean {
    return (
      a.length === b.length && a.every((value, index) => value === b[index])
    );
  }

  const handleClickSave = async () => {
    // console.log($newRelays);
    if (arraysEqual($newRelays, relays)) {
      return;
    }
    onClickSave($newRelays);
  };
</script>

<div
  class="mx-auto w-full rounded-xl bg-neutral-800 shadow-md overflow-hidden mb-1"
  {...$root}
>
  <h2 class="flex w-full px-2">
    <button
      use:melt={$trigger("item-1")}
      class="flex flex-1 cursor-pointer items-center justify-between bg-neutral-800 py-2 text-base font-medium leading-none text-magnum-300 transition-colors hover:bg-neutral-800 focus:!ring-0 focus-visible:text-magnum-800 rounded-xl text-ellipsis
    w-full"
    >
      {title}<ChevronDown />
    </button>
  </h2>
  {#if $isSelected("item-1")}
    <div
      class="content overflow-hidden bg-neutral-800 text-sm text-neutral-100"
      use:melt={$content("item-1")}
      transition:slide
    >
      <div
        id="item-1"
        class="overflow-hidden transition-colors first:rounded-t-xl
            last:rounded-b-xl p-2"
      >
        <button
          class="rounded-md bg-magnum-700 px-2 py-1 font-bold hover:opacity-75 active:opacity-50"
          onclick={() => ($newRelays = relays)}>RESET</button
        >
        <div class="text-sm p-1">
          {#each $newRelays as relay}
            <div class="flex items-center gap-1">
              <RelayStatusColor {relay} />{relay}<button
                class="ml-1 rounded-full bg-magnum-700 hover:opacity-75 active:opacity-50"
                onclick={() => removeRelay(relay)}><X /></button
              >
            </div>
          {/each}
          <div class="flex my-1 gap-1">
            <input
              id="relay"
              type="text"
              placeholder="wss://"
              bind:value={newRelayURL}
            />
            <button
              class="rounded-full px-1 bg-magnum-700 hover:opacity-75 active:opacity-50"
              onclick={handleClickAdd}>ADD</button
            >
          </div>
        </div>
        <button
          class="rounded-md bg-magnum-700 px-2 py-1 font-bold hover:opacity-75 active:opacity-50"
          onclick={handleClickSave}>SAVE</button
        >
      </div>
      <hr />
      <div class=" font-medium text-magnum-400 p-2">
        {#if Description}
          <Description />
        {/if}
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  .content {
    box-shadow: inset 0px 1px 0px theme("colors.neutral.300");
  }
</style>
