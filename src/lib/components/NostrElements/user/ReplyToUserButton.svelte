<script lang="ts">
  import { page } from "$app/state";
  import { additionalPostOptions, postWindowOpen } from "$lib/stores/stores";
  import type { AdditionalPostOptions } from "$lib/types";
  import { Reply } from "lucide-svelte";
  import * as nip19 from "nostr-tools/nip19";

  interface Props {
    pubkey: string;
  }

  let { pubkey }: Props = $props();

  function handleClickRelayToUser() {
    let kind = 1; // Default kind for normal notes
    let tags: string[][] = [["p", pubkey]];
    // Extract the note ID from URL params
    const noteParam = page.params.note;

    // Check if we're on a channel page
    if (page.url.pathname.includes("/channel/") && noteParam) {
      let roomTag: string[] | undefined;

      try {
        const decoded = nip19.decode(noteParam);
        if (decoded.type === "note") {
          roomTag = ["e", decoded.data, "", "root"];
        } else if (decoded.type === "nevent") {
          roomTag = ["e", decoded.data.id, "", "root"];
        }
      } catch (error) {
        console.log(error);
      }
      if (roomTag) {
        kind = 42; // Channel message kind
        tags.push(roomTag);
      }
    }

    const options: AdditionalPostOptions = {
      kind: kind,
      tags: tags,
      content: "",
      defaultUsers: [pubkey],
      warningText: undefined,
      addableUserList: [],
    };
    additionalPostOptions.set(options);
    setTimeout(() => {
      $postWindowOpen = true;
    }, 1);
  }
</script>

<button
  onclick={handleClickRelayToUser}
  class="w-fit rounded-full bg-neutral-200 text-magnum-600 p-1 hover:opacity-75 active:opacity-50 h-fit my-auto"
  title={"reply"}><Reply /></button
>
