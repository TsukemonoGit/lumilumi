<script lang="ts">
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { MessageCircleMore } from "lucide-svelte";

  import CustomReaction from "../NostrElements/kindEvents/NoteActionButtuns/CustomReaction.svelte";
  import PicQuarity from "./PicQuarity.svelte";
  import SettingsCard from "./SettingsCard.svelte";
  import type { LumiSetting } from "$lib/types";
  import { writable, type Writable } from "svelte/store";
  import Popover from "../Elements/Popover.svelte";
  import Link from "../Elements/Link.svelte";

  interface Props {
    settings: LumiSetting;
  }
  let { settings = $bindable() }: Props = $props();
  let customString: string = $state("");

  const emojiTag: Writable<string[]> = writable([]);

  emojiTag.subscribe((value) => {
    if (value && value.length > 0) {
      console.log(value);
      settings.defaultReaction = {
        content: `:${value[0]}:`,
        tag: ["emoji", ...value],
      };
    }
  });

  const handleClickOk = () => {
    console.log(customString);
    if (customString) {
      settings.defaultReaction = { content: customString, tag: [] };
    }
  };
</script>

<SettingsCard title={$_("settings.post.title")}>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <span class="">{$_("settings.post.defaultReaction")}</span>
      <div class="flex items-center gap-2">
        <CustomReaction
          publishAndSetQuery={() => {}}
          note={undefined}
          root={undefined}
          atag={undefined}
          {handleClickOk}
          bind:emoji={$emojiTag}
          bind:customReaction={customString}
        />
        {#if settings.defaultReaction?.tag?.length > 0}
          {#if lumiSetting.value.showImg}
            <img
              loading="lazy"
              class="h-6 object-contain"
              src={settings.defaultReaction.tag[2]}
              alt={settings.defaultReaction.tag[1]}
              title={settings.defaultReaction.tag[1]}
            />
          {:else}
            {settings.defaultReaction.tag[1]}
          {/if}
        {:else if settings.defaultReaction?.content}
          {settings.defaultReaction.content}
        {/if}
      </div>
    </div>

    <div class="flex flex-col gap-2 pb-4 mb-4">
      <div class="flex items-center justify-between">
        <span class="">{$_("settings.post.picQuarity")}</span>
        <span class=" font-medium">{settings.picQuarity}%</span>
      </div>
      <div class="mx-4">
        <PicQuarity bind:value={settings.picQuarity} />
      </div>
    </div>

    <label class="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        class="rounded-checkbox"
        bind:checked={settings.addClientTag}
      />
      <span class="">{$_("settings.post.addClientTag")}</span>
    </label>

    <div class="flex items-center gap-2">
      <label class="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.protectedEvents}
        />
        <span class="">
          {$_("settings.post.protectedEvents.title")}
          <Link
            className=" underline text-magnum-300"
            href="https://github.com/nostr-protocol/nips/blob/master/70.md"
            >(NIP-70)</Link
          >
        </span>
      </label>
      <Popover ariaLabel="protected events">
        <MessageCircleMore size={16} class="text-magnum-500" />
        {#snippet popoverContent()}
          <div class="w-52 pt-4">
            {$_("settings.post.protectedEvents.message")}
          </div>
        {/snippet}
      </Popover>
    </div>
  </div>
</SettingsCard>
