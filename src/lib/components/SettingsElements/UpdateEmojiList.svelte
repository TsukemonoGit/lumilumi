<script lang="ts">
  import { formatAbsoluteDateFromUnix } from "$lib/func/util";
  import { emojis } from "$lib/stores/stores";
  import Dialog from "../Elements/Dialog.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";

  import * as nip19 from "nostr-tools/nip19";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { SmilePlus } from "lucide-svelte";
  import EmojiListUpdate from "./EmojiListUpdate.svelte";

  let dialogOpen: boolean = $state(false);
</script>

<EmojiListUpdate
  buttonClass="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 disabled:opacity-25"
>
  Emoji
</EmojiListUpdate>
<time class="ml-2"
  >{$_("settings.lastUpdated")}: {$emojis
    ? formatAbsoluteDateFromUnix($emojis?.updated)
    : ""}</time
>{#if $emojis}<button
    type="button"
    class="rounded-md border ml-2 p-1 m-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
    onclick={() => (dialogOpen = true)}>view data</button
  >{/if}
<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen} id={"emoji"}>
  {#snippet title()}
    <SmilePlus />{$_("customEmoji.title")}
  {/snippet}
  {#snippet main()}
    <div class="w-full overflow-x-hidden">
      {#if $emojis}
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
      {#if lumiSetting.get().pubkey}<a
          class="underline text-magnum-300 break-all ml-4 text-sm"
          target="_blank"
          rel="noopener noreferrer"
          href="https://nostviewstr.vercel.app/{nip19.npubEncode(
            lumiSetting.get().pubkey
          )}/10030"
          >{$_("settings.nostviewstr.kind10030")}
        </a>{/if}
    </div>
  {/snippet}
</Dialog>
