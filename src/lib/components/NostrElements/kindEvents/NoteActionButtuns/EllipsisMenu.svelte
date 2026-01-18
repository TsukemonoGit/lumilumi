<script lang="ts">
  import { modalState, nowProgress, queryClient } from "$lib/stores/stores";
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
    Route,
  } from "lucide-svelte";

  import * as Nostr from "nostr-typedef";
  import {
    deleteEvent,
    getRelayById,
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

  import {
    generateResultMessage,
    parseNaddr,
    translateText,
  } from "$lib/func/util";

  import ModalJson from "$lib/components/ModalJson.svelte";
  import { isReplaceableKind, isAddressableKind } from "nostr-tools/kinds";
  import {
    latest,
    nip07Signer,
    type EventPacket,
    type OkPacketAgainstEvent,
  } from "rx-nostr";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";

  import Note from "../Note.svelte";
  import {
    bookmark10003,
    loginUser,
    lumiSetting,
  } from "$lib/stores/globalRunes.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { addToast } from "$lib/components/Elements/Toast.svelte";
  import { useLatestEvent } from "$lib/stores/useLatestEvent";

  interface MenuItem {
    text: string;
    icon: any;
    action: string;
  }

  interface MenuGroup {
    label: string;
    items: MenuItem[];
  }

  interface Props {
    note: Nostr.Event;
    indexes?: number[] | undefined;
    TriggerIcon?: any;
    iconSize?: number;
    iconClass?: string;
    deleted?: boolean;
    isBookmarked?: boolean;
    zIndex?: number;
  }

  let {
    zIndex,
    note,
    indexes = undefined,
    TriggerIcon = Ellipsis,
    iconSize = 20,
    iconClass = "",
    deleted = $bindable(false),
    isBookmarked,
  }: Props = $props();

  let deleteDialogOpen: (bool: boolean) => void = $state(() => {});

  let replaceable = $derived(
    note && (isReplaceableKind(note.kind) || isAddressableKind(note.kind))
  );

  let { naddr, nevent, encodedPubkey } = $derived.by(() => {
    if (!note) {
      return { naddr: undefined, nevent: undefined, encodedPubkey: undefined };
    }

    const encodeAddress = () => {
      try {
        const naddrpointer: nip19.AddressPointer = {
          kind: note.kind,
          identifier:
            (note?.tags || []).find((item) => item[0] === "d")?.[1] ?? "",
          pubkey: note?.pubkey || "",
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
          author: note?.pubkey || "",
          kind: note.kind,
        };
        return nip19.neventEncode(eventpointer);
      } catch {
        return undefined;
      }
    };

    const encodePubkey = () => {
      try {
        return nip19.npubEncode(note?.pubkey || "");
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
  // メニュー項目を階層構造に整理
  let menuGroups: MenuGroup[] = $derived.by(() => {
    const viewItems: MenuItem[] = [];
    const copyItems: MenuItem[] = [];
    const actionItems: MenuItem[] = [];
    const editItems: MenuItem[] = [];
    const otherItems: MenuItem[] = [];
    const externalItems: MenuItem[] = [];
    // 表示グループ
    viewItems.push({
      text: `${$_("menu.view.note")}`,
      icon: Notebook,
      action: "goto_note",
    });
    externalItems.push({
      text: `${$_("menu.external.njump")}`,
      icon: SquareArrowOutUpRight,
      action: "open_njump",
    });
    viewItems.push({
      text: `${$_("menu.view.json")}`,
      icon: FileJson2,
      action: "view_json",
    });

    viewItems.push({
      text: `${$_("menu.view.neighbor")}`,
      icon: Route,
      action: "goto_feed",
    });

    viewItems.push({
      text: `${$_("menu.view.translate")}`,
      icon: Earth,
      action: "translate",
    });
    // コピーグループ
    copyItems.push({
      text: `${$_("menu.copy.text")}`,
      icon: NotepadText,
      action: "copy_text",
    });
    copyItems.push({
      text: `${replaceable ? `${$_("menu.copy.naddr")}` : `${$_("menu.copy.nevent")}`}`,
      icon: Copy,
      action: "copy_id",
    });
    copyItems.push({
      text: `${$_("menu.copy.embed")}`,
      icon: CodeXml,
      action: "copy_embed_code",
    });

    copyItems.push({
      text: `${$_("menu.copy.sharelink")}`,
      icon: Share,
      action: "share_link",
    });

    // アクショングループ
    if (
      !(
        (note?.tags || []).find((tag) => tag[0] === "-") &&
        (note?.pubkey || "") !== lumiSetting.get().pubkey
      )
    ) {
      actionItems.push({
        text: `${$_("menu.action.broadcast")}`,
        icon: Radio,
        action: "broadcast",
      });
    }

    if (
      (note?.pubkey || "") === lumiSetting.get().pubkey &&
      note.kind === 30023
    ) {
      actionItems.push({
        text: `${$_("menu.action.MAKIMONO")}`,
        icon: FilePenLine,
        action: "open_makimono",
      });
    }

    if (note.kind === 1 || note.kind === 42 || note.kind === 30023) {
      actionItems.push({
        text: `${isBookmarked ? `${$_("menu.action.bookmark.remove")}` : `${$_("menu.action.bookmark.add")}`}`,
        icon: isBookmarked ? BookmarkMinus : BookmarkPlus,
        action: "toggle_bookmark",
      });
    }

    if (replaceable) {
      actionItems.push({
        text: `${$_("menu.action.refresh")}`,
        icon: RefreshCw,
        action: "refresh_data",
      });
    }

    if (
      (note?.pubkey || "") === lumiSetting.get().pubkey &&
      note.kind !== 5 &&
      note.kind !== 62
    ) {
      actionItems.push({
        text: `${$_("menu.action.delete")}`,
        icon: Trash,
        action: "delete",
      });
    }

    // 外部リンクグループ

    if (note.kind === 30030) {
      externalItems.push({
        text: `${$_("menu.external.emoji")}`,
        icon: Smile,
        action: "open_emojito",
      });
    }

    if (note.kind === 30311) {
      externalItems.push({
        text: `${$_("menu.external.stream")}`,
        icon: Tv,
        action: "open_zapstream",
      });
    }

    if (note.kind === 31990) {
      externalItems.push({
        text: `${$_("menu.external.nostrapp")}`,
        icon: Layers,
        action: "open_nostrapp",
      });
    }

    if (nostviewstrable.includes(note.kind)) {
      externalItems.push({
        text: `${$_("menu.external.nostviewstr")}`,
        icon: Squirrel,
        action: "open_nostviewstr",
      });
    }
    // グループを構築
    const groups = [];

    if (viewItems.length > 0) {
      groups.push({ label: `${$_("menu.group.view")}`, items: viewItems });
    }

    if (copyItems.length > 0) {
      groups.push({ label: `${$_("menu.group.copy")}`, items: copyItems });
    }
    if (actionItems.length > 0) {
      groups.push({ label: `${$_("menu.group.action")}`, items: actionItems });
    }
    if (editItems.length > 0) {
      groups.push({ label: `${$_("menu.group.edit")}`, items: editItems });
    }
    if (externalItems.length > 0) {
      groups.push({
        label: `${$_("menu.group.external")}`,
        items: externalItems,
      });
    }
    if (otherItems.length > 0) {
      groups.push({ label: `${$_("menu.group.other")}`, items: otherItems });
    }

    return groups;
  });

  const handleSelectItem = async (action: string) => {
    switch (action) {
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
          addToast({
            data: {
              title: "Success",
              description: `Copied to clipboard`,
              color: "bg-green-500",
            },
          });
        } catch (error: any) {
          console.error(error.message);
          addToast({
            data: {
              title: "Error",
              description: "Failed to copy",
              color: "bg-orange-500",
            },
          });
        }
        break;

      case "goto_note":
        goto(`/${replaceable ? naddr : nevent}`);
        break;

      case "goto_feed":
        goto(`/${replaceable ? naddr : nevent}/feed`);
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
          addToast({
            data: {
              title: "Error",
              description: "Failed to share",
              color: "bg-orange-500",
            },
          });
        }
        break;

      case "copy_text":
        try {
          await navigator.clipboard.writeText(note.content);
          addToast({
            data: {
              title: "Success",
              description: `Copied to clipboard`,
              color: "bg-green-500",
            },
          });
        } catch (error: any) {
          console.error(error.message);
          addToast({
            data: {
              title: "Error",
              description: "Failed to copy",
              color: "bg-orange-500",
            },
          });
        }
        break;

      case "copy_embed_code":
        try {
          const embedCode = generateEmbedCode();
          await navigator.clipboard.writeText(embedCode);

          addToast({
            data: {
              title: "Success",
              description: "Embed code copied to clipboard",
              color: "bg-green-500",
            },
          });
        } catch (error: any) {
          console.error(error.message);
          addToast({
            data: {
              title: "Error",
              description: "Failed to copy embed code",
              color: "bg-orange-500",
            },
          });
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
        const makimono = `https://makimono.lumilumi.app/${naddr}`;
        window.open(makimono, "_blank", "noreferrer");
        break;

      case "refresh_data":
        $nowProgress = true;
        const atag = `${note.kind}:${note?.pubkey || ""}:${(note?.tags || []).find((tag) => tag[0] === "d")?.[1] || ""}`;
        const key: QueryKey = ["naddr", atag] as QueryKey;
        const address = parseNaddr(["a", atag]);

        const filter: Nostr.Filter = {
          kinds: [address.kind],
          authors: [address.pubkey],
          ...(address.identifier ? { "#d": [address.identifier] } : {}),
          limit: 1,
        };

        try {
          await usePromiseReq(
            {
              filters: [filter],
              operator: pipe(latest()),
            },
            address.relays?.slice(0, 3),
            5000,
            (data: EventPacket[]) => {
              // onDataコールバック: データ受信の都度実行
              if (data.length > 0) {
                const newEvent = data[0].event;
                const currentData = queryClient.getQueryData(key) as
                  | EventPacket
                  | undefined;

                // 既存データより新しい場合のみ更新
                if (
                  !currentData ||
                  newEvent.created_at > currentData.event.created_at
                ) {
                  queryClient.setQueryData(key, () => data[0]);
                }
              }
            }
          );
        } catch (error) {
          console.error(error);
        }

        $nowProgress = false;
        break;

      case "toggle_bookmark":
        try {
          if (typeof isBookmarked === "undefined") {
            console.error("isBookmarked is undefined");
            break;
          }

          let pre: Nostr.Event<number> | null = bookmark10003.get();
          const pub = loginUser.value;

          if (!pub) {
            console.error("User not logged in");
            break;
          }

          if (!pre || pre.pubkey !== pub) {
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

          const relayHint = getRelayById(note.id);
          const tags = (): string[][] => {
            const [tagType, tagValue] = replaceable
              ? [
                  "a",
                  `${note.kind}:${note?.pubkey || ""}:${(note?.tags || []).find((t) => t[0] === "d")?.[1] || ""}`,
                ]
              : ["e", note.id];

            const existing = pre?.tags || [];

            return isBookmarked
              ? existing.filter((t) => !(t[0] === tagType && t[1] === tagValue))
              : [...existing, [tagType, tagValue, relayHint]];
          };
          const eventParam: Nostr.EventParameters = {
            kind: 10003,
            pubkey: pub,
            content: pre ? pre.content : "",
            tags: $state.snapshot(tags()),
          };

          const signer = nip07Signer();
          try {
            const event = await signer.signEvent(eventParam);

            publishEvent(event);
            addToast({
              data: {
                title: "Published",
                description: "",
                color: "bg-green-500",
              },
            });

            $nowProgress = false;
          } catch (error) {
            addToast({
              data: {
                title: "Failed",
                description: "failed to publish",
                color: "bg-red-500",
              },
            });

            $nowProgress = false;
          }
        } catch (error) {
          console.error("Bookmark toggle error:", error);
          addToast({
            data: {
              title: "Failed",
              description: "failed to toggle bookmark",
              color: "bg-red-500",
            },
          });
          $nowProgress = false;
        }
        break;
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
          `${note.kind}:${note?.pubkey || ""}:${(note?.tags || []).find((item) => item[0] === "d")?.[1] || ""}`,
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

      addToast({
        data: {
          title: isSuccess.length > 0 ? "Success" : "Failed",
          description: str,
          color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
        },
      });
      if (isSuccess.length > 0) {
        queryClient.removeQueries({ queryKey: ["note", note.id] });
        deleted = true;
      }
    } catch (error) {
      console.error(error);
      addToast({
        data: {
          title: "Error",
          description: "Failed to delete",
          color: "bg-orange-500",
        },
      });
    }
    return;
  };
</script>

<DropdownMenu
  {zIndex}
  buttonClass="actionButton flex items-center"
  {menuGroups}
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
