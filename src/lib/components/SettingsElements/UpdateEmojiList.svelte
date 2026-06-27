<script lang="ts">
  import { formatAbsoluteDateFromUnix } from "$lib/func/util";
  import { emojis } from "$lib/stores/stores";
  import Dialog from "../Elements/Dialog.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";

  import { writable, type Writable } from "svelte/store";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { SmilePlus } from "lucide-svelte";
  import EmojiListUpdate from "./EmojiListUpdate.svelte";
  import SyncCard from "./SyncCard.svelte";

  // svelte-ignore non_reactive_update
  let dialogOpen: Writable<boolean> = writable(false);
  let handleClickEmoji = $state(() => {});
</script>

<EmojiListUpdate bind:handleClickEmoji />
<SyncCard
  onclickUpdate={handleClickEmoji}
  label={`${$_("settings.douki.emoji")} (kind:10030)`}
  updatedAt={$emojis ? formatAbsoluteDateFromUnix($emojis?.updated) : ""}
  viewable={$emojis ? true : false}
  onclickView={() => ($dialogOpen = true)}
/>

<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen} id={"emoji"}>
  {#snippet main()}
    <div class="w-full overflow-x-hidden">
      {#if $emojis}
        <h2 class="text-magnum-200 m-0 text-lg font-bold flex gap-1">
          <SmilePlus />{$_("customEmoji.title")}
        </h2>
        <div
          class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh] flex flex-wrap"
        >
          {#each $emojis.list as e, index}
            <div
              class="grid grid-rows-[auto_auto] border rounded-md border-magnum-500/50"
            >
              {#if lumiSetting.get().showImg}<img
                  height="48px"
                  loading="lazy"
                  class="h-12 min-w-12 object-contain justify-self-center"
                  src={e[1]}
                  alt={e[0]}
                />{:else}{e[1]}{/if}
              <div class="break-keep">{e[0]}</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/snippet}
</Dialog>
