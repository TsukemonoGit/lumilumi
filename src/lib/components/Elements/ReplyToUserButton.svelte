<script lang="ts">
  import { additionalPostOptions, postWindowOpen } from "$lib/stores/stores";
  import type { AdditionalPostOptions } from "$lib/types";
  import { Reply } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  interface Props {
    metadata: Nostr.Event;
  }

  let { metadata }: Props = $props();

  function handleClickRelayToUser() {
    const options: AdditionalPostOptions = {
      kind: 1,
      tags: [["p", metadata.pubkey]],
      content: "", //`nostr:${nip19.npubEncode(metadata.pubkey)}`,
      defaultUsers: [metadata.pubkey], //[metadata.pubkey],
      warningText: undefined,
      addableUserList: [],
    };
    $additionalPostOptions = options;
    setTimeout(() => {
      $postWindowOpen = true;
    }, 1);
  }
</script>

<button
  onclick={handleClickRelayToUser}
  class="w-fit rounded-full bg-neutral-200 text-magnum-600 p-1 hover:opacity-75 active:opacity-50"
  title={"reply"}><Reply /></button
>
