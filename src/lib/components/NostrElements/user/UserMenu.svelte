<!--UserMenu.svelte-->
<script lang="ts">
  import {
    modalState,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import {
    ChevronRight,
    Copy,
    EyeOff,
    FileJson2,
    RefreshCcw,
    User,
    Radio,
    Share,
    Search,
  } from "lucide-svelte";
  import UserMuteMenu from "./UserMuteMenu.svelte";
  import { goto } from "$app/navigation";
  import { t as _ } from "@konemono/svelte5-i18n";

  import type { QueryKey } from "@tanstack/svelte-query";
  import * as Nostr from "nostr-typedef";
  import type { Profile } from "$lib/types";
  import { publishEvent } from "$lib/func/nostr";
  import * as nip19 from "nostr-tools/nip19";
  import { page } from "$app/state";

  import ModalJson from "$lib/components/ModalJson.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { getNip05FromProfile } from "$lib/func/nip05";

  interface Props {
    metadata: Nostr.Event | undefined;
    pubkey: string;
    profile: Profile | undefined;
    tab?: string | undefined;
  }

  let { metadata, pubkey, profile, tab }: Props = $props();

  let encodedPubkey = $derived.by(() => {
    if (pubkey) {
      try {
        return nip19.npubEncode(pubkey);
      } catch {
        return undefined;
      }
    }
  });

  // メニュー項目の定義を論理的な順序で整理
  let menuTexts = $derived.by(() => {
    const menuItems = [
      // 基本操作グループ
      {
        text: `${$_("menu.copy.pubkey")}`,
        icon: Copy,
        action: "copy_pubkey",
      },
      {
        text: `${$_("menu.userPage")}`,
        icon: User,
        action: "goto_user",
      },

      // 検索・発見グループ
      {
        text: `${$_("menu.userSearch")}`,
        icon: Search,
        action: "search_user",
      },

      // データ更新・管理グループ
      {
        text: `${$_("menu.updateProfile")}`,
        icon: RefreshCcw,
        action: "update_profile",
      },

      // ブロードキャスト（条件付き）
      ...(metadata &&
      !(
        metadata.tags.some((tag) => tag[0] === "-") &&
        metadata.pubkey !== lumiSetting.get().pubkey
      )
        ? [
            {
              text: `${$_("menu.broadcast")}`,
              icon: Radio,
              action: "broadcast",
            },
          ]
        : []),

      // 共有・外部リンクグループ
      ...(tab
        ? [
            {
              text: `${$_("menu.sharelink")}`,
              icon: Share,
              action: "share_link",
            },
          ]
        : []),

      // ツール・ユーティリティグループ
      ...(metadata
        ? [
            {
              text: `${$_("menu.json")}`,
              icon: FileJson2,
              action: "view_json",
            },
          ]
        : []),
    ];

    // 現在のページがユーザー自身のページの場合はユーザーページへのリンクを除外
    return menuItems.filter((item) => {
      if (
        item.action === "goto_user" &&
        page.url.pathname === `/${encodedPubkey}`
      ) {
        return false;
      }
      return true;
    });
  });

  const handleSelectItem = async (index: number) => {
    const selectedItem = menuTexts[index];

    switch (selectedItem.action) {
      case "copy_pubkey":
        try {
          if (encodedPubkey) {
            await navigator.clipboard.writeText(encodedPubkey);
            $toastSettings = {
              title: "Success",
              description: "Copied to clipboard",
              color: "bg-green-500",
            };
          } else {
            throw new Error("No encoded pubkey");
          }
        } catch (error: any) {
          console.error(error.message);
          $toastSettings = {
            title: "Warning",
            description: "Failed to copy",
            color: "bg-orange-500",
          };
        }
        break;

      case "goto_user":
        if (encodedPubkey) {
          goto(`/${encodedPubkey}`);
        }
        break;

      case "search_user":
        goto(`search?q=author:${encodedPubkey}&load=false`);
        break;

      case "update_profile":
        $nowProgress = true;
        const key: QueryKey = ["metadata", pubkey];
        queryClient.invalidateQueries({ queryKey: key });
        setTimeout(() => {
          $nowProgress = false;
        }, 1000);
        break;

      case "broadcast":
        if (metadata) {
          publishEvent(metadata);
          $nowProgress = true;
          setTimeout(() => {
            $nowProgress = false;
          }, 1000);
        }
        break;

      case "share_link":
        if (!encodedPubkey) {
          return;
        }

        $nowProgress = true;

        try {
          // getNip05FromProfileを使用してNIP-05アドレスを取得
          const verifiedNip05 = await getNip05FromProfile(
            profile,
            pubkey,
            queryClient
          );
          const urlData = verifiedNip05 || encodedPubkey;

          const shareData = {
            text: "",
            url: `${page.url.origin}/${urlData}${tab ? `#${tab}` : ""}`,
          };

          await navigator.share(shareData);
        } catch (error: any) {
          console.error(error.message);
          $toastSettings = {
            title: "Error",
            description: "Failed to share",
            color: "bg-orange-500",
          };
        } finally {
          $nowProgress = false;
        }
        break;

      case "view_json":
        $modalState = {
          isOpen: true,
          component: ModalJson,
          props: {
            note: metadata,
            profile: profile,
          },
        };
        break;
    }
  };
</script>

{#each menuTexts as { icon: Icon, text }, index}
  <button
    onclick={() => handleSelectItem(index)}
    class="
     flex
     font-medium leading-none bg-neutral-800 text-magnum-300 hover:bg-magnum-500/25 active:opacity-50 disabled:opacity-15 py-1 items-center"
  >
    <Icon class="mx-2 my-auto" />{text}
  </button>
{/each}
{#if lumiSetting.get().pubkey && pubkey !== lumiSetting.get().pubkey}
  <UserMuteMenu {pubkey}>
    <div
      class="
    flex
    font-medium leading-none bg-neutral-800 text-magnum-300 hover:bg-magnum-500/25 active:opacity-50 disabled:opacity-15 py-1 items-center"
    >
      <div class="inline-flex rounded-full text-sm my-auto items-center">
        <EyeOff class="mx-2 my-auto" />MUTE
      </div>
      <ChevronRight class="ml-auto" />
    </div></UserMuteMenu
  >{/if}
