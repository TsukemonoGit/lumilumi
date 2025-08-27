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
    BookmarkMinus,
    BookmarkPlus,
    CodeXml,
    type IconProps,
  } from "lucide-svelte";

  import * as Nostr from "nostr-typedef";
  import {
    deleteEvent,
    getRelaysById,
    publishEvent,
    usePromiseReq,
  } from "$lib/func/nostr";
  import * as nip19 from "nostr-tools/nip19";
  import { pipe } from "rxjs";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { goto } from "$app/navigation";
  import { t as _, locale } from "@konemono/svelte5-i18n";

  import { page } from "$app/state";
  import { nostviewstrable } from "$lib/func/constants";

  import { generateResultMessage, translateText } from "$lib/func/util";

  import ModalJson from "$lib/components/ModalJson.svelte";
  import { isReplaceableKind, isAddressableKind } from "nostr-tools/kinds";
  import { latest, nip07Signer, type OkPacketAgainstEvent } from "rx-nostr";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";

  import Note from "../Note.svelte";
  import {
    bookmark10003,
    loginUser,
    lumiSetting,
  } from "$lib/stores/globalRunes.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";
  import type { SvelteComponent } from "svelte";

  interface Props {
    note: Nostr.Event;
    indexes?: number[] | undefined;
    TriggerIcon?: typeof SvelteComponent<IconProps>;
    iconSize?: number;
    iconClass?: string;
    deleted: boolean;
    isBookmarked?: boolean;
  }

  let {
    note,
    indexes = undefined,
    TriggerIcon = Ellipsis,
    iconSize = 20,
    iconClass = "",
    deleted = $bindable(false),
    isBookmarked,
  }: Props = $props();

  let deleteDialogOpen: (bool: boolean) => void = $state(() => {});

  const replaceable = $derived(
    note && (isReplaceableKind(note.kind) || isAddressableKind(note.kind))
  );

  const { naddr, nevent, encodedPubkey } = $derived.by(() => {
    if (!note) {
      return { naddr: undefined, nevent: undefined, encodedPubkey: undefined };
    }

    const encodeAddress = () => {
      try {
        const naddrpointer: nip19.AddressPointer = {
          kind: note.kind,
          identifier: note.tags.find((item) => item[0] === "d")?.[1] ?? "",
          pubkey: note.pubkey,
          relays: getRelaysById(note.id),
        };
        return nip19.naddrEncode(naddrpointer);
      } catch {
        return undefined;
      }
    };

    const encodeEvent = () => {
      try {
        const eventpointer: nip19.EventPointer = {
          id: note.id,
          relays: getRelaysById(note.id),
          author: note.pubkey,
          kind: note.kind,
        };
        return nip19.neventEncode(eventpointer);
      } catch {
        return undefined;
      }
    };

    const encodePubkey = () => {
      try {
        return nip19.npubEncode(note.pubkey);
      } catch {
        return undefined;
      }
    };

    return replaceable
      ? {
          naddr: encodeAddress(),
          nevent: undefined,
          encodedPubkey: encodePubkey(),
        }
      : {
          naddr: undefined,
          nevent: encodeEvent(),
          encodedPubkey: encodePubkey(),
        };
  });

  // 埋め込みコードを生成する関数
  const generateEmbedCode = (): string => {
    const seenon = getRelaysById(note.id);
    const scriptTag = `<${"script"} src="https://cdn.jsdelivr.net/npm/@konemono/nostr-web-components@latest/dist/nostr-web-components.iife.js"></${"script"}>`;

    // relays配列をJSON形式でエスケープして文字列化
    const relaysAttr =
      seenon && seenon.length > 0 ? ` relays='${JSON.stringify(seenon)}'` : "";

    if (replaceable) {
      return [
        scriptTag,
        `<nostr-naddr href="https://lumilumi.app/{id}" naddr="${naddr}"${relaysAttr}></nostr-naddr>`,
      ].join("\n");
    } else {
      return [
        scriptTag,
        `<nostr-note href="https://lumilumi.app/{id}" id="${nevent}"${relaysAttr}></nostr-note>`,
      ].join("\n");
    }
  };

  // メニュー項目の定義を論理的な順序で整理
  const menuTexts = $derived.by(() => {
    const menuItems = [
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

      // 埋め込みコード（条件付き）
      {
        text: `${$_("menu.copy.embed")}`,
        icon: CodeXml,
        action: "copy_embed_code",
      },

      {
        text: `${$_("menu.note")}`,
        icon: Notebook,
        action: "goto_note",
      },

      // ブックマーク（条件付き）
      ...(note.kind === 1 || note.kind === 30023
        ? [
            {
              text: `${isBookmarked ? `${$_("menu.bookmark.remove")}` : `${$_("menu.bookmark.add")}`}`,
              icon: isBookmarked ? BookmarkMinus : BookmarkPlus,
              action: "toggle_bookmark",
            },
          ]
        : []),

      // データ更新ボタン（条件付き）
      ...(replaceable
        ? [
            {
              text: `${$_("menu.refresh")}`,
              icon: RefreshCw,
              action: "refresh_data",
            },
          ]
        : []),

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

      // 外部サービス（条件付き）
      ...(note.kind === 30030
        ? [
            {
              text: `${$_("menu.emoji")}`,
              icon: Smile,
              action: "open_emojito",
            },
          ]
        : []),

      ...(note.kind === 30311
        ? [
            {
              text: `${$_("menu.stream")}`,
              icon: Tv,
              action: "open_zapstream",
            },
          ]
        : []),

      ...(note.kind === 31990
        ? [
            {
              text: `${$_("menu.nostrapp")}`,
              icon: Layers,
              action: "open_nostrapp",
            },
          ]
        : []),

      ...(nostviewstrable.includes(note.kind)
        ? [
            {
              text: `${$_("menu.nostviewstr")}`,
              icon: Squirrel,
              action: "open_nostviewstr",
            },
          ]
        : []),

      ...(note.pubkey === lumiSetting.get().pubkey && note.kind === 30023
        ? [
            {
              text: `${$_("menu.MAKIMONO")}`,
              icon: FilePenLine,
              action: "open_makimono",
            },
          ]
        : []),

      // Broadcast（条件付き）
      ...(!(
        note.tags.find((tag) => tag[0] === "-") &&
        note.pubkey !== lumiSetting.get().pubkey
      )
        ? [
            {
              text: `${$_("menu.broadcast")}`,
              icon: Radio,
              action: "broadcast",
            },
          ]
        : []),

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

      // 削除ボタン（条件付き、最後に配置）
      ...(note.pubkey === lumiSetting.get().pubkey &&
      note.kind !== 5 &&
      note.kind !== 62
        ? [
            {
              text: `${$_("menu.delete")}`,
              icon: Trash,
              action: "delete",
            },
          ]
        : []),
    ];

    // indexes指定時の処理を変更
    if (indexes !== undefined) {
      const numToActionMap: Record<number, string> = {
        0: "view_json",
        1: "open_njump",
        2: "translate",
        3: "copy_id",
        4: "goto_note",
        5: "open_emojito",
        6: "broadcast",
        7: "share_link",
        8: "copy_text",
        9: "open_zapstream",
        10: "open_nostviewstr",
        11: "open_nostrapp",
        12: "delete",
        13: "open_makimono",
        14: "refresh_data",
        15: "toggle_bookmark",
        16: "copy_embed_code",
      };

      const allowedActions = indexes
        .map((i) => numToActionMap[i])
        .filter(Boolean);
      return menuItems.filter((item) => allowedActions.includes(item.action));
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

      case "open_njump": {
        const njumpUrl = `https://njump.me/${replaceable ? naddr : nevent}`;
        window.open(njumpUrl, "_blank", "noreferrer");
        break;
      }

      case "translate":{
        const translateUrl = `https://translate.google.com/?sl=auto&tl=${$locale}&op=translate&text=${translateText(note.content)}`;
        window.open(translateUrl, "_blank", "noreferrer");
        break;
 }
      case "copy_id":{
        try {
          await navigator.clipboard.writeText(
            replaceable ? (naddr ?? "") : (nevent ?? "")
          );
          $toastSettings = {
            title: "Success",
            description: `Copied to clipboard`,
            color: "bg-green-500",
          };
        } catch{
          $toastSettings = {
            title: "Error",
            description: "Failed to copy",
            color: "bg-orange-500",
          };
        }
        break;
}
      case "goto_note":
        goto(`/${replaceable ? naddr : nevent}`);
        break;

      case "open_emojito":{
        const emojito = `https://emojito.meme/a/${naddr}`;
        window.open(emojito, "_blank", "noreferrer");
        break;
}
      case "broadcast":
        publishEvent(note);
        break;

      case "share_link":{
        const shareData = {
          title: "",
          url: `${page.url.origin}/${replaceable ? naddr : nevent}`,
        };
        try {
          await navigator.share(shareData);
        } catch  {
       
          $toastSettings = {
            title: "Error",
            description: "Failed to share",
            color: "bg-orange-500",
          };
        }
        break;
}
      case "copy_text":{
        try {
          await navigator.clipboard.writeText(note.content);
          $toastSettings = {
            title: "Success",
            description: `Copied to clipboard`,
            color: "bg-green-500",
          };
        } catch{
       
          $toastSettings = {
            title: "Error",
            description: "Failed to copy",
            color: "bg-orange-500",
          };
        }
        break;
}
      case "copy_embed_code":{
        try {
          const embedCode = generateEmbedCode();
          await navigator.clipboard.writeText(embedCode);

          $toastSettings = {
            title: "Success",
            description: "Embed code copied to clipboard",
            color: "bg-green-500",
          };
        } catch  {
        
          $toastSettings = {
            title: "Error",
            description: "Failed to copy embed code",
            color: "bg-orange-500",
          };
        }
        break;
}
      case "open_zapstream":{
        const zapStream = `https://zap.stream/${naddr}`;
        window.open(zapStream, "_blank", "noreferrer");
        break;
}
      case "open_nostviewstr":{
        const nostviewer = `https://nostviewstr.vercel.app/${naddr}`;
        window.open(nostviewer, "_blank", "noreferrer");
        break;
}
      case "open_nostrapp":{
        const nostrapp = `https://nostrapp.link/a/${naddr}`;
        window.open(nostrapp, "_blank", "noreferrer");
        break;
}
      case "delete":
        deleteDialogOpen(true);
        break;

      case "open_makimono":{
        const makimono = `https://makimono.lumilumi.app//${naddr}`;
        window.open(makimono, "_blank", "noreferrer");
        break;}
      case "refresh_data":{
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
      case "toggle_bookmark":{
        try {
          // isBookmarked の状態を確認
          if (typeof isBookmarked === "undefined") {
            console.error("isBookmarked is undefined");
            break;
          }

          let pre: Nostr.Event<number> | null = bookmark10003.get();
          const pub = loginUser.get();

          if (!pub) {
            console.error("User not logged in");
            break;
          }

          if (!pre || pre.pubkey !== pub) {
            //なかったらほんとにないのか確認する
            const bookmarkEvent = await usePromiseReq(
              {
                filters: [{ kinds: [10003], authors: [pub], limit: 1 }],
                operator: pipe(latest()),
              },
              undefined,
              2000
            );

            if (bookmarkEvent.length > 0) {
              pre = bookmarkEvent[0].event;
            } else {
              pre = null;
            }
          }
          const tags = (): string[][] => {
            const [tagType, tagValue] = replaceable
              ? [
                  "a",
                  `${note.kind}:${note.pubkey}:${note.tags.find((t) => t[0] === "d")?.[1] || ""}`,
                ]
              : ["e", note.id];

            const existing = pre?.tags || [];

            return isBookmarked
              ? existing.filter((t) => !(t[0] === tagType && t[1] === tagValue))
              : [...existing, [tagType, tagValue]];
          };
          const eventParam: Nostr.EventParameters = {
            kind: 10003,
            pubkey: pub,
            content: pre ? pre.content : "",
            tags: tags(),
          };
          const signer = nip07Signer();
          try {
            const event = await signer.signEvent(eventParam);

            publishEvent(event);
            $toastSettings = {
              title: "Published",
              description: "",
              color: "bg-green-500",
            };

            $nowProgress = false;
          } catch (error) {
            $toastSettings = {
              title: "Failed",
              description: "failed to publish",
              color: "bg-red-500",
            };

            $nowProgress = false;
          }
        } catch (error) {
          console.error("Bookmark toggle error:", error);
          $toastSettings = {
            title: "Failed",
            description: "failed to toggle bookmark",
            color: "bg-red-500",
          };
          $nowProgress = false;
        }
        break;}
    }
  };

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
      const str = generateResultMessage(isSuccess, isFailed);

      $toastSettings = {
        title: isSuccess.length > 0 ? "Success" : "Failed",
        description: str,
        color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
      };
      if (isSuccess.length > 0) {
        queryClient.removeQueries({ queryKey: ["note", note.id] });
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
