<script lang="ts">
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  import { t as _ } from "@konemono/svelte5-i18n";
  import { ArrowUpRight, X } from "lucide-svelte";
  import SettingsCard from "./SettingsCard.svelte";
  import { normalizeURL } from "nostr-tools/utils";
  import { relayRegex2 } from "$lib/func/regex";
  import { addToast } from "../Elements/Toast.svelte";
  import type { LumiSetting } from "$lib/types";

  interface Props {
    settings: LumiSetting;
    inputPubkey: string;
  }
  let { settings = $bindable(), inputPubkey }: Props = $props();

  let relayInput: string = $state("");

  //const optionsArr = ["0", "1"];
  let optionsArrStr = $derived([
    `${$_("settings.relayMenuText0")}`,
    `${$_("settings.relayMenuText1")}`,
  ]);

  function addRelay() {
    if (!relayInput) return;
    try {
      let input = normalizeURL(relayInput.trim());

      if (relayRegex2.test(input)) {
        settings.relays = [
          ...settings.relays,
          { url: input, read: true, write: true },
        ];
        relayInput = "";
      }
    } catch (error) {
      addToast({
        data: {
          title: "Error",
          description: `Invalid URL`,
          color: "bg-red-500",
        },
      });
    }
  }

  function removeRelay(url: string) {
    settings.relays = settings.relays.filter((relay) => relay.url !== url);
  }

  function selectOption(index: number) {
    settings.useRelaySet = index.toString();
  }

  function handleKeydown(event: KeyboardEvent, index: number) {
    const last = optionsArrStr.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = index === last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = index === 0 ? last : index - 1;
    } else if (event.key === " " || event.key === "Enter") {
      nextIndex = index;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      selectOption(nextIndex);
      const nextEl = document.getElementById(nextIndex.toString());
      nextEl?.focus();
    }
  }
</script>

<SettingsCard title={$_("settings.relay.title")}>
  <div
    role="radiogroup"
    class="flex flex-col gap-3 data-[orientation=horizontal]:flex-row"
    aria-label="View density"
  >
    {#each optionsArrStr as option, index}
      <div class="flex items-center gap-3 w-fit">
        <button
          type="button"
          role="radio"
          aria-checked={settings.useRelaySet === index.toString()}
          tabindex={settings.useRelaySet === index.toString() ? 0 : -1}
          class="grid h-6 min-w-6 place-items-center rounded-full shadow-sm border border-neutral-500"
          id={index.toString()}
          aria-labelledby="{index.toString()}-label"
          onclick={() => selectOption(index)}
          onkeydown={(e) => handleKeydown(e, index)}
        >
          {#if settings.useRelaySet === index.toString()}
            <div class="h-3 w-3 rounded-full bg-neutral-400"></div>
          {/if}
        </button>
        <label
          class=" capitalize leading-none cursor-pointer"
          for={index.toString()}
          id="{index.toString()}-label"
        >
          {option}{#if index === 0 && lumiSetting.get().pubkey}
            <a
              class="underline text-neutral-300 break-all flex-wrap inline-flex"
              href={`/${inputPubkey}/relays`}
              >{$_("settings.kind10002")}<ArrowUpRight size={18} /></a
            >
          {/if}
        </label>
      </div>
    {/each}
  </div>

  <!-- リレー設定 -->

  {#if settings.useRelaySet === "1"}
    <div class="w-full pl-8 p-2">
      <div
        class="grid grid-cols-[20px_20px_1fr_20px] items-center gap-x-3 gap-y-3 border-l-2 pl-2 border-neutral-500/30"
      >
        <div class="text-xs text-neutral-500 text-center">Read</div>
        <div class="text-xs text-neutral-500 text-center">Write</div>
        <div></div>
        <div></div>

        {#each settings.relays as relay, index}
          <input
            type="checkbox"
            bind:checked={relay.read}
            aria-label="Read: {relay.url}"
            class="justify-self-center accent-neutral-500"
          />
          <input
            type="checkbox"
            bind:checked={relay.write}
            aria-label="Write: {relay.url}"
            class="justify-self-center accent-neutral-500"
          />
          <div class="truncate">{relay.url}</div>
          <button
            type="button"
            class="justify-self-center myButton rounded-full w-6 h-6 flex justify-center items-center bg-neutral-900"
            onclick={() => removeRelay(relay.url)}
          >
            <X class="stroke-orange-500/70" size={18} />
          </button>
        {/each}
      </div>

      <div class="flex items-center gap-2 mt-4 w-full">
        <input
          type="text"
          id="relay"
          class="h-10 w-[240px] rounded-md px-3 py-2 border border-neutral-500/50"
          placeholder="wss://"
          bind:value={relayInput}
        />
        <button
          type="button"
          class="h-10 rounded-full text-neutral-200 px-6 py-1 bg-neutral-800 myButton font-medium"
          onclick={addRelay}>Add</button
        >
      </div>
    </div>
  {/if}
</SettingsCard>
