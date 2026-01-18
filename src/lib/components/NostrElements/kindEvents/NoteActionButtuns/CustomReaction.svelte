<script lang="ts">
  import Popover from "$lib/components/Elements/Popover.svelte";
  import { SmilePlus } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import { clientTag } from "$lib/func/constants";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { getRelayById } from "$lib/func/nostr";
  import EmojiPicker from "../../../Elements/EmojiPicker.svelte";

  interface Props {
    note: Nostr.Event | undefined;
    root: string[] | undefined;
    atag: string | undefined;
    customReaction?: string;
    emoji?: string[];
    handleClickOk?: any | undefined;
    publishAndSetQuery: any;
    zIndex?: number;
  }

  let {
    note,
    root,
    atag,
    customReaction = $bindable(""),
    emoji = $bindable([]),
    handleClickOk = undefined,
    publishAndSetQuery,
    zIndex,
  }: Props = $props();

  let openPopover: (bool: boolean) => void = () => {};

  const handleEmojiSelect = async (
    emojiContent: string,
    emojiTag?: string[]
  ) => {
    if (emojiTag) {
      emoji = emojiTag;
    }

    if (!note) {
      if (!emojiTag) {
        handleClickOk?.();
      }
      return;
    }

    const tags: string[][] = root ? [root] : [];
    const relayHint = getRelayById(note.id);

    tags.push(
      ["p", note?.pubkey || ""],
      ["e", note.id, relayHint, note?.pubkey || ""],
      ["k", note.kind.toString()]
    );

    if (atag) {
      tags.push(["a", atag, relayHint]);
    }

    if (emojiTag) {
      tags.push(["emoji", ...emojiTag]);
    }

    if (lumiSetting.get().addClientTag) {
      tags.push(clientTag);
    }

    const ev: Nostr.EventParameters = {
      kind: 7,
      tags: tags,
      content: emojiContent,
    };

    await publishAndSetQuery(ev, ["reactions", atag ?? note.id, "reaction"]);
    openPopover?.(false);
    customReaction = "";
  };
</script>

<Popover
  {zIndex}
  bind:openPopover
  buttonClass={"actionButton"}
  ariaLabel="Open emoji picker"
>
  <SmilePlus size="20" class="stroke-magnum-500/75" />

  {#snippet popoverContent()}
    <EmojiPicker bind:customReaction onSelect={handleEmojiSelect} />
  {/snippet}
</Popover>
