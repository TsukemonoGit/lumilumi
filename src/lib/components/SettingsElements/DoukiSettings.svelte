<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";

  import SettingsCard from "./SettingsCard.svelte";
  import type { LumiSetting } from "$lib/types";

  import UpdateEmojiList from "./UpdateEmojiList.svelte";
  import UpdateMutebykindList from "./UpdateMutebykindList.svelte";
  import UpdateMuteList from "./UpdateMuteList.svelte";
  import { writable, type Writable } from "svelte/store";
  import Dialog from "../Elements/Dialog.svelte";
  import Link from "../Elements/Link.svelte";

  interface Props {
    settings: LumiSetting;
  }
  let { settings = $bindable() }: Props = $props();
</script>

<SettingsCard title={$_("settings.douki.title")}>
  <!--mute-->
  <div class="mt-2">
    <UpdateMuteList bind:pubkey={settings.pubkey} />
  </div>

  <!--mute by kind-->
  <div class="mt-12">
    <UpdateMutebykindList bind:pubkey={settings.pubkey} />
  </div>

  <!--emoji-->
  <div class="mt-7">
    <UpdateEmojiList />
  </div>
  <div class="text-sm pl-12 mt-2">
    {$_("settings.emoji.notes")}
    <Link
      className="underline text-magnum-300"
      href={"https://github.com/nostr-protocol/nips/blob/master/30.md"}
      >(NIP-30)</Link
    >
  </div>
</SettingsCard>
