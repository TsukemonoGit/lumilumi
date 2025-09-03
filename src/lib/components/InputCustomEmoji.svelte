<script lang="ts">
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { emojis } from "$lib/stores/stores";
  import { RefreshCw, SmilePlus } from "lucide-svelte";

  import EmojiListUpdate from "./SettingsElements/EmojiListUpdate.svelte";
  import Popover from "./Elements/Popover.svelte";
  interface Props {
    input?: string;
    onClickEmoji: (eTag: string[]) => void;
  }
  let { input = "", onClickEmoji }: Props = $props();
  let openPopover: (bool: boolean) => void = $state(() => {});
</script>

<Popover bind:openPopover ariaLabel="custom emoji" zIndex={100}>
  <div class="actionButton">
    <SmilePlus size="20" />
  </div>
  {#snippet popoverContent()}
    <div>
      <div
        class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-40 overflow-y-auto max-w-[calc(min(100vw,400px))]"
        style="overflow-anchor: auto;"
      >
        {#each $emojis.list as e, index}
          {#if input === "" || e[0]
              .toLowerCase()
              .includes(input.replace(":", "").toLowerCase())}
            <button
              onclick={() => onClickEmoji(e)}
              class="rounded-md border m-0.5 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
            >
              {#if lumiSetting.get().showImg}
                <img
                  height="24px"
                  loading="lazy"
                  class="h-6 min-w-6 object-contain justify-self-center"
                  src={e[1]}
                  alt={e[0]}
                  title={e[0]}
                />{:else}{e[0]}{/if}
            </button>
          {/if}
        {/each}
        <EmojiListUpdate
          buttonClass="ml-auto p-1 m-1 rounded-full   hover:opacity-75 active:opacity-50 bg-magnum-600/70 text-magnum-300"
        >
          <RefreshCw />
        </EmojiListUpdate>
      </div>
    </div>
  {/snippet}
</Popover>
