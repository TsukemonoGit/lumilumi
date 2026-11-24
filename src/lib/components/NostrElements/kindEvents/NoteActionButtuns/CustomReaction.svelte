<!--CustomReaction.svelte-->
<script lang="ts">
  import Popover from "#lib/components/Elements/Popover.svelte";
  import { FaceSlightlySmilingPlus } from "@lucide/svelte";
  import EmojiPicker from "../../../Elements/EmojiPicker.svelte";

  interface Props {
    /**
     * リアクションが選択されたときに呼ばれる。
     * emojiTag は `["emoji", name, url]` 形式の完全なタグ。
     */
    onSelect: (content: string, emojiTag?: string[]) => void;
    zIndex?: number;
  }

  let { onSelect, zIndex }: Props = $props();

  let openPopover: (bool: boolean) => void = () => {};

  const handleSelect = (content: string, emojiTag?: string[]): void => {
    onSelect(content, emojiTag ? ["emoji", ...emojiTag] : undefined);
    openPopover?.(false);
  };
</script>

<Popover
  {zIndex}
  bind:openPopover
  buttonClass="actionButton"
  ariaLabel="Open emoji picker"
>
  <FaceSlightlySmilingPlus size="20" class="stroke-magnum-500/75" />

  {#snippet popoverContent()}
    <EmojiPicker onSelect={handleSelect} />
  {/snippet}
</Popover>
