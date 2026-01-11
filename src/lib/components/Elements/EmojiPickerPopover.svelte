<!-- EmojiPickerPopover.svelte -->
<script lang="ts">
  import Popover from "$lib/components/Elements/Popover.svelte";
  import EmojiPicker from "$lib/components/Elements/EmojiPicker.svelte";
  import { SmilePlus } from "lucide-svelte";

  interface Props {
    onSelect: (emoji: string, emojiTag?: string[]) => void;
    customReaction?: string;
    buttonClass?: string;
    ariaLabel?: string;
    zIndex?: number;
  }

  let {
    onSelect,
    customReaction = $bindable(""),
    buttonClass = "actionButton",
    ariaLabel = "Open emoji picker",
    zIndex,
  }: Props = $props();

  let openPopover: (bool: boolean) => void = $state(() => {});

  const handleSelect = (emoji: string, emojiTag?: string[]) => {
    openPopover(false);
    onSelect(emoji, emojiTag);
  };
</script>

<Popover bind:openPopover {buttonClass} {ariaLabel} {zIndex}>
  <SmilePlus size="20" />
  {#snippet popoverContent()}
    <EmojiPicker bind:customReaction onSelect={handleSelect} />
  {/snippet}
</Popover>
