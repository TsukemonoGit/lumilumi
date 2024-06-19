<script lang="ts">
  import { toastSettings } from "$lib/stores/stores";
  import {
    Copy,
    Earth,
    Ellipsis,
    FileJson2,
    SquareArrowOutUpRight,
  } from "lucide-svelte";

  import * as Nostr from "nostr-typedef";
  import { getRelaysById } from "$lib/func/nostr";
  import { nip19 } from "nostr-tools";
  import { metadata } from "$lib/stores/operators";
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";

  export let note: Nostr.Event;
  export let profile: Nostr.Event<number> | undefined;
  let dialogOpen: any;

  const menuTexts =
    //  profile
    //   ? [
    //       { text: "Copy EventID", icon: Copy, num: 3 },
    //       { text: "Copy Pubkey", icon: Copy, num: 4 },
    //       { text: "View Json", icon: FileJson2, num: 0 },
    //       { text: "Open in njump", icon: SquareArrowOutUpRight, num: 1 },
    //       { text: "Google Translate", icon: Earth, num: 2 },
    //     ]
    //   :
    [
      { text: "Copy EventID", icon: Copy, num: 3 },
      { text: "View Json", icon: FileJson2, num: 0 },
      { text: "Open in njump", icon: SquareArrowOutUpRight, num: 1 },
      { text: "Google Translate", icon: Earth, num: 2 },
    ];
  const handleSelectItem = async (index: number) => {
    console.log(menuTexts[index]);
    const eventpointer: nip19.EventPointer = {
      id: note.id,
      relays: getRelaysById(note.id),
      author: note.pubkey,
      kind: note.kind,
    };
    const nevent = nip19.neventEncode(eventpointer);
    switch (menuTexts[index].num) {
      case 0:
        //view json
        $dialogOpen = true;
        break;

      case 1:
        //open in njump

        const url = `https://njump.me/${nevent}`;

        window.open(url, "_blank", "noreferrer");
        break;

      case 2:
        //Translate
        const translateUrl = `https://translate.google.com/?sl=auto&op=translate&text=${encodeURIComponent(note.content)}`;

        window.open(translateUrl, "_blank", "noreferrer");
        break;

      case 3:
        //Copy EventID
        try {
          await navigator.clipboard.writeText(nevent);
          $toastSettings = {
            title: "Success",
            description: `Copied to clipboard`,
            color: "bg-green-500",
          };
        } catch (error: any) {
          console.error(error.message);
          $toastSettings = {
            title: "Warning",
            description: "Failed to copy",
            color: "bg-orange-500",
          };
        }
        break;
    }
  };
</script>

<DropdownMenu {menuTexts} {handleSelectItem}>
  <Ellipsis size="20" />
</DropdownMenu>

<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  <div slot="main">
    <h2 class="m-0 text-lg font-medium">EVENT JSON</h2>
    <div
      class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[30vh]"
    >
      {JSON.stringify(note, null, 2)}
    </div>

    <h2 class="m-0 text-lg font-medium">Seen on</h2>
    <div class="break-words whitespace-pre-wrap">
      {getRelaysById(note.id).join(", ")}
    </div>
  </div></Dialog
>
