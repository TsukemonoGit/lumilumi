<script lang="ts">
  import {
    modalState,
    nowProgress,
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
    FilePenLine,
    RefreshCw,
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
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";

  interface Props {
    note: Nostr.Event;
    indexes?: number[] | undefined;
    TriggerIcon?: any;
    iconSize?: number;
    iconClass?: string;
    deleted: boolean;
  }

  let {
    note,
    indexes = undefined,
    TriggerIcon = Ellipsis,
    iconSize = 20,
    iconClass = "",
    deleted = $bindable(false),
  }: Props = $props();

  let deleteDialogOpen: (bool: boolean) => void = $state(() => {});

  let replaceable = $derived(
    note && (isReplaceableKind(note.kind) || isAddressableKind(note.kind))
  );

  // メニュー項目の定義を論理的な順序で整理
  let menuTexts = $derived.by(() => {
    const baseMenuItems = [
      // 基本操作グループ
      {
        text: `${$_("menu.copy.text")}`,
        icon: NotepadText,
        action: "copy_text",
      },
      {
        text: `${replaceable ? `${$_("menu.copy.naddr")}` : `${$_("menu.copy.nevent")}`}`,
        icon: Copy,
        action: "copy_id",
      },
      {
        text: `${$_("menu.note")}`,
        icon: Notebook,
        action: "goto_note",
      },
      // 共有・外部リンクグループ
      {
        text: `${$_("menu.sharelink")}`,
        icon: Share,
        action: "share_link",
      },
      {
        text: `${$_("menu.njump")}`,
        icon: SquareArrowOutUpRight,
        action: "open_njump",
      },

      // ツール・ユーティリティグループ
      {
        text: `${$_("menu.translate")}`,
        icon: Earth,
        action: "translate",
      },
      {
        text: `${$_("menu.json")}`,
        icon: FileJson2,
        action: "view_json",
      },
    ];

    let menuItems = [...baseMenuItems];

    // 条件付きメニュー項目を適切な位置に挿入

    // データ更新ボタン（条件付きで基本操作グループに追加）
    if (replaceable) {
      menuItems.splice(3, 0, {
        text: `${$_("menu.refresh")}`,
        icon: RefreshCw,
        action: "refresh_data",
      });
    }

    // Broadcast（NIP-70チェック後、ツールセクションに追加）
    if (
      !(
        note.tags.find((tag) => tag[0] === "-") &&
        note.pubkey !== lumiSetting.get().pubkey
      )
    ) {
      menuItems.splice(7, 0, {
        text: `${$_("menu.broadcast")}`,
        icon: Radio,
        action: "broadcast",
      });
    }

    // 種類別の外部サービスリンク（外部リンクグループの後に追加）
    const externalServices = [];

    if (note.kind === 30030) {
      externalServices.push({
        text: `${$_("menu.emoji")}`,
        icon: Smile,
        action: "open_emojito",
      });
    }

    if (note.kind === 30311) {
      externalServices.push({
        text: `${$_("menu.stream")}`,
        icon: Tv,
        action: "open_zapstream",
      });
    }

    if (note.kind === 31990) {
      externalServices.push({
        text: `${$_("menu.nostrapp")}`,
        icon: Layers,
        action: "open_nostrapp",
      });
    }

    if (nostviewstrable.includes(note.kind)) {
      externalServices.push({
        text: `${$_("menu.nostviewstr")}`,
        icon: Squirrel,
        action: "open_nostviewstr",
      });
    }

    if (note.pubkey === lumiSetting.get().pubkey && note.kind === 30023) {
      externalServices.push({
        text: `${$_("menu.MAKIMONO")}`,
        icon: FilePenLine,
        action: "open_makimono",
      });
    }

    // 外部サービスリンクを適切な位置に挿入
    if (externalServices.length > 0) {
      const njumpIndex = menuItems.findIndex(
        (item) => item.action === "open_njump"
      );
      menuItems.splice(njumpIndex + 1, 0, ...externalServices);
    }

    // 削除ボタンは最後に追加
    if (
      note.pubkey === lumiSetting.get().pubkey &&
      note.kind !== 5 &&
      note.kind !== 62
    ) {
      menuItems.push({
        text: `${$_("menu.delete")}`,
        icon: Trash,
        action: "delete",
      });
    }

    // indexesが指定されている場合は、従来の番号システムをマッピング
    if (indexes !== undefined) {
      const actionToNumMap = {
        view_json: 0,
        open_njump: 1,
        translate: 2,
        copy_id: 3,
        goto_note: 4,
        open_emojito: 5,
        broadcast: 6,
        share_link: 7,
        copy_text: 8,
        open_zapstream: 9,
        open_nostviewstr: 10,
        open_nostrapp: 11,
        delete: 12,
        open_makimono: 13,
        refresh_data: 14,
      };

      menuItems = menuItems.filter((item) => {
        const num = actionToNumMap[item.action as keyof typeof actionToNumMap];
        return num !== undefined && indexes.includes(num);
      });
    }

    return menuItems;
  });

  const handleSelectItem = async (index: number) => {
    const selectedItem = menuTexts[index];

    switch (selectedItem.action) {
      case "view_json":
        $modalState = {
          isOpen: true,
          component: ModalJson,
          props: { note: note },
        };
        break;

      case "open_njump":
        const njumpUrl = `https://njump.me/${replaceable ? naddr : nevent}`;
        window.open(njumpUrl, "_blank", "noreferrer");
        break;

      case "translate":
        const translateUrl = `https://translate.google.com/?sl=auto&tl=${$locale}&op=translate&text=${translateText(note.content)}`;
        window.open(translateUrl, "_blank", "noreferrer");
        break;

      case "copy_id":
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

      case "goto_note":
        goto(`/${replaceable ? naddr : nevent}`);
        break;

      case "open_emojito":
        const emojito = `https://emojito.meme/a/${naddr}`;
        window.open(emojito, "_blank", "noreferrer");
        break;

      case "broadcast":
        publishEvent(note);
        break;

      case "share_link":
        const shareData = {
          title: "",
          url: `${page.url.origin}/${replaceable ? naddr : nevent}`,
        };
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

      case "copy_text":
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

      case "open_zapstream":
        const zapStream = `https://zap.stream/${naddr}`;
        window.open(zapStream, "_blank", "noreferrer");
        break;

      case "open_nostviewstr":
        const nostviewer = `https://nostviewstr.vercel.app/${naddr}`;
        window.open(nostviewer, "_blank", "noreferrer");
        break;

      case "open_nostrapp":
        const nostrapp = `https://nostrapp.link/a/${naddr}`;
        window.open(nostrapp, "_blank", "noreferrer");
        break;

      case "delete":
        deleteDialogOpen(true);
        break;

      case "open_makimono":
        const makimono = `https://makimono.lumilumi.app//${naddr}`;
        window.open(makimono, "_blank", "noreferrer");
        break;
      case "refresh_data":
        $nowProgress = true;
        const key: QueryKey = [
          "naddr",
          `${note.kind}:${note.pubkey}:${note.tags.find((tag) => tag[0] === "d")?.[1] || ""}`,
        ] as QueryKey;
        queryClient.invalidateQueries({ queryKey: key });
        setTimeout(() => {
          $nowProgress = false;
        }, 1000);
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
            relays: getRelaysById(note.id),
          };
          naddr = nip19.naddrEncode(naddrpointer);
          nevent = undefined;
        } else {
          const eventpointer: nip19.EventPointer = {
            id: note.id,
            relays: getRelaysById(note.id),
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

      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
      const isFailed = res.filter((item) => !item.ok).map((item) => item.from);
      let str = generateResultMessage(isSuccess, isFailed);

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
        maxHeight={192}
      />
    </div>
  {/snippet}
</AlertDialog>
