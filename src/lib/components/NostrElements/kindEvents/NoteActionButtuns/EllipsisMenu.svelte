<script lang="ts">
  import {
    loginUser,
    modalState,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import {
    Copy,
    Earth,
    Ellipsis,
    FileJson2,
    SquareArrowOutUpRight,
    Smile,
    Radio,
    Share,
    NotepadText,
    Tv,
    Squirrel,
    Layers,
    Notebook,
    Trash,
  } from "lucide-svelte";

  import * as Nostr from "nostr-typedef";
  import { deleteEvent, getRelaysById, publishEvent } from "$lib/func/nostr";
  import { nip19 } from "nostr-tools";

  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { goto } from "$app/navigation";
  import { t as _, locale } from "@konemono/svelte5-i18n";

  import { page } from "$app/state";
  import { nostviewstrable } from "$lib/func/constants";

  import { generateResultMessage, translateText } from "$lib/func/util";

  import ModalJson from "$lib/components/ModalJson.svelte";
  import { isReplaceableKind, isAddressableKind } from "nostr-tools/kinds";
  import type { OkPacketAgainstEvent } from "rx-nostr";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";

  import Note from "../Note.svelte";
  interface Props {
    note: Nostr.Event;
    indexes?: number[] | undefined;
    TriggerIcon?: any;
    iconSize?: number;
    iconClass?: string;
    tieKey: string | undefined;
    deleted: boolean;
  }

  let {
    note,
    indexes = undefined,
    TriggerIcon = Ellipsis,
    iconSize = 20,
    iconClass = "",
    tieKey,
    deleted = $bindable(false),
  }: Props = $props();
  let deleteDialogOpen: (bool: boolean) => void = $state(() => {});
  // svelte-ignore non_reactive_update
  // let dialogOpen: Writable<boolean> = writable(false);

  let replaceable = $derived(
    note && (isReplaceableKind(note.kind) || isAddressableKind(note.kind))
  );

  let menuTexts = $derived.by(() => {
    let menu = [
      {
        text: `${$_("menu.copy.text")}`,
        icon: NotepadText,
        num: 8,
      },
      {
        text: `${replaceable ? `${$_("menu.copy.naddr")}` : `${$_("menu.copy.nevent")}`}`,
        icon: Copy,
        num: 3,
      },
      { text: `${$_("menu.json")}`, icon: FileJson2, num: 0 },
      { text: `${$_("menu.njump")}`, icon: SquareArrowOutUpRight, num: 1 },
      { text: `${$_("menu.translate")}`, icon: Earth, num: 2 },
      { text: `${$_("menu.note")}`, icon: Notebook, num: 4 },

      { text: `${$_("menu.sharelink")}`, icon: Share, num: 7 },
    ];

    //NIP-70
    if (
      !(note.tags.find((tag) => tag[0] === "-") && note.pubkey !== $loginUser)
    ) {
      menu.push({ text: `${$_("menu.broadcast")}`, icon: Radio, num: 6 });
    }

    //30030 emojitoリンク
    if (note.kind === 30030) {
      menu.push({ text: `${$_("menu.emoji")}`, icon: Smile, num: 5 });
    }

    //30311 zap.streamリンク
    if (note.kind === 30311) {
      menu.push({ text: `${$_("menu.stream")}`, icon: Tv, num: 9 });
    }
    //31990 App Managerリンク
    if (note.kind === 31990) {
      menu.push({ text: `${$_("menu.nostrapp")}`, icon: Layers, num: 11 });
    }
    //replaceable のすとびうあのリンク
    if (nostviewstrable.includes(note.kind)) {
      menu.push({
        text: `${$_("menu.nostviewstr")}`,
        icon: Squirrel,
        num: 10,
      });
    }
    if (indexes !== undefined) {
      menu = menu.filter((item) => indexes.includes(item.num));
    }
    if (
      note.pubkey === $loginUser &&
      note.kind !== 5 &&
      note.kind !==
        62 /*消滅イベントhttps://github.com/nostr-protocol/nips/blob/master/62.md**/
    ) {
      menu.push({
        text: `${$_("menu.delete")}`,
        icon: Trash,
        num: 12,
      });
    }
    return menu;
  });

  const handleSelectItem = async (index: number) => {
    //  console.log(menuTexts[index]);

    switch (menuTexts[index].num) {
      case 0:
        //view json
        //$dialogOpen = true;
        $modalState = {
          isOpen: true,
          component: ModalJson,
          props: { note: note, tieKey: tieKey },
        };
        break;

      case 1:
        //open in njump

        const url = `https://njump.me/${replaceable ? naddr : nevent}`;

        window.open(url, "_blank", "noreferrer");
        break;

      case 2:
        //Translate

        const translateUrl = `https://translate.google.com/?sl=auto&tl=${$locale}&op=translate&text=${translateText(note.content)}`;

        window.open(translateUrl, "_blank", "noreferrer");
        break;

      case 3:
        //Copy EventID
        try {
          await navigator.clipboard.writeText(
            replaceable ? (naddr ?? "") : (nevent ?? "")
          );
          $toastSettings = {
            title: "Success",
            description: `Copied to clipboard`,
            color: "bg-green-500",
          };
        } catch (error: any) {
          console.error(error.message);
          $toastSettings = {
            title: "Error",
            description: "Failed to copy",
            color: "bg-orange-500",
          };
        }
        break;
      case 4:
        //Goto Note page
        goto(`/${replaceable ? naddr : nevent}`);
        break;
      case 5:
        //open in emojito
        const emojito = `https://emojito.meme/a/${naddr}`;

        window.open(emojito, "_blank", "noreferrer");
        break;

      case 6:
        //broadcast
        publishEvent(note);
        // setTimeout(() => {
        //   slicedEvent.update((value) => value);
        //   console.log("こうしんしたよ");
        // }, 1000);
        break;
      case 7:
        //Share link
        const shareData = {
          title: "",
          //text: "lumilumi",
          url: `${page.url.origin}/${replaceable ? naddr : nevent}`,
        };
        //console.log(shareData);
        try {
          await navigator.share(shareData);
        } catch (error: any) {
          console.error(error.message);
          $toastSettings = {
            title: "Error",
            description: "Failed to share",
            color: "bg-orange-500",
          };
        }
        break;

      case 8:
        //Copy text
        try {
          await navigator.clipboard.writeText(note.content);
          $toastSettings = {
            title: "Success",
            description: `Copied to clipboard`,
            color: "bg-green-500",
          };
        } catch (error: any) {
          console.error(error.message);
          $toastSettings = {
            title: "Error",
            description: "Failed to copy",
            color: "bg-orange-500",
          };
        }
        break;
      case 9:
        //open in zap.stream
        const zapStream = `https://zap.stream/${naddr}`;

        window.open(zapStream, "_blank", "noreferrer");
        break;
      case 10:
        //open in nostviewer
        const nostviewer = `https://nostviewstr.vercel.app/${naddr}`;

        window.open(nostviewer, "_blank", "noreferrer");
        break;
      case 11:
        //open in nostviewer
        const nostrapp = `https://nostrapp.link/a/${naddr}`;

        window.open(nostrapp, "_blank", "noreferrer");
        break;
      case 12:
        //delete
        deleteDialogOpen(true);
        break;
    }
  };

  let { naddr, nevent, encodedPubkey } = $derived.by(() => {
    let nevent: string | undefined = undefined;
    let naddr: string | undefined = undefined;
    let encodedPubkey: string | undefined = undefined;
    if (note) {
      try {
        if (replaceable) {
          const naddrpointer: nip19.AddressPointer = {
            kind: note.kind,
            identifier: note.tags.find((item) => item[0] === "d")?.[1] ?? "",
            pubkey: note.pubkey,
            relays: tieKey ? getRelaysById(note.id, tieKey) : [],
          };
          naddr = nip19.naddrEncode(naddrpointer);
          nevent = undefined;
        } else {
          const eventpointer: nip19.EventPointer = {
            id: note.id,
            relays: tieKey ? getRelaysById(note.id, tieKey) : [],
            author: note.pubkey,
            kind: note.kind,
          };

          nevent = nip19.neventEncode(eventpointer);
          naddr = undefined;
        }
      } catch (error) {
        nevent = undefined;
        naddr = undefined;
      }
      try {
        encodedPubkey = nip19.npubEncode(note.pubkey);
      } catch {
        encodedPubkey = undefined;
      }
    }
    return { naddr, nevent, encodedPubkey };
  });

  const onClickOK = async () => {
    deleteDialogOpen(false);
    try {
      const deletetags = [
        ["e", note.id],
        ["k", note.kind.toString()],
      ];
      if (isAddressableKind(note.kind) || isReplaceableKind(note.kind)) {
        deletetags.push([
          "a",
          `${note.kind}:${note.pubkey}:${note.tags.find((item) => item[0] === "d")?.[1] || ""}`,
        ]);
      }
      const {
        event,
        res,
      }: {
        event: Nostr.Event;
        res: OkPacketAgainstEvent[];
      } = await deleteEvent(deletetags);
      // console.log(res);
      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
      const isFailed = res.filter((item) => !item.ok).map((item) => item.from);
      let str = generateResultMessage(isSuccess, isFailed);
      // console.log(str);

      $toastSettings = {
        title: isSuccess.length > 0 ? "Success" : "Failed",
        description: str,
        color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
      };
      if (isSuccess.length > 0) {
        queryClient.removeQueries({ queryKey: ["timeline", note.id] });
        deleted = true;
      }
    } catch (error) {
      console.error(error);
      $toastSettings = {
        title: "Error",
        description: "Failed to delete",
        color: "bg-orange-500",
      };
    }
    return;
  };
</script>

<DropdownMenu
  buttonClass="actionButton flex items-center"
  {menuTexts}
  {handleSelectItem}
>
  <TriggerIcon size={iconSize} class="min-w-[{iconSize}px] {iconClass}" />
</DropdownMenu>

<!--JSON no Dialog
<ModalJson bind:dialogOpen {note} {tieKey} />-->
<AlertDialog
  bind:openDialog={deleteDialogOpen}
  onClickOK={() => onClickOK()}
  title="Delete note"
>
  {#snippet main()}<p>{$_("post.delete")}</p>
    <div class="rounded-md border-magnum-600/30 border">
      <Note
        id={note.id}
        displayMenu={false}
        depth={0}
        repostable={false}
        {tieKey}
      />
    </div>
  {/snippet}
</AlertDialog>
