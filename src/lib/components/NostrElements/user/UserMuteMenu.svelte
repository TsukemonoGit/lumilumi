<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { User, Zap, Repeat2, SmilePlus, Slash } from "lucide-svelte";

  import { userMuteStatus } from "$lib/func/util";
  import type { UserMuteStatus } from "$lib/types";

  import { t as _ } from "@konemono/svelte5-i18n";

  import { createTooltip } from "@melt-ui/svelte";
  import { melt } from "@melt-ui/svelte/internal/actions";
  import { fade } from "svelte/transition";
  import { usePromiseReq } from "$lib/func/nostr";
  import { latest } from "rx-nostr";
  import { pipe } from "rxjs";
  import {
    mutebykinds,
    mutes,
    nowProgress,
    toastSettings,
  } from "$lib/stores/stores";

  import {
    updateMuteByList,
    toMuteList,
    decryptContent,
    encryptPrvTags,
  } from "$lib/func/settings";
  import { refetchKind10000 } from "$lib/func/mute";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { safePublishEvent } from "$lib/func/publishError";
  interface Props {
    pubkey: string;
    children?: import("svelte").Snippet;
  }

  let { pubkey, children }: Props = $props();

  //-------------------------------------mute menu
  const {
    elements: { trigger, content, arrow },
    states: { open },
  } = createTooltip({
    positioning: {
      placement: "right", // ツールチップのデフォルト位置
      strategy: "absolute", // `absolute` もしくは `fixed`

      flip: {
        fallbackPlacements: ["left", "bottom", "top"], // はみ出した時の代替位置
        padding: 8, // 画面の端からの余白
      },

      // offset: {
      //   mainAxis: 5, // 主軸のオフセット
      //   crossAxis: 0, // クロス軸のオフセット
      // },

      overflowPadding: 8, // 画面の端から8px以内に収める
      boundary: "clippingAncestors", // `boundary`を指定して、表示エリアの外にはみ出さないようにする
    },
    openDelay: 0,
    closeDelay: 0,
    closeOnPointerDown: false,
    forceVisible: true,
  });

  const muteMenu = [
    {
      id: "user" as keyof UserMuteStatus,
      addText: `${$_("mute.user.add")}`,
      removeText: `${$_("mute.user.remove")}`,
      Icon: User,
    },
    {
      id: "repost" as keyof UserMuteStatus,
      addText: `${$_("mute.repost.add")}`,
      removeText: `${$_("mute.repost.remove")}`,
      Icon: Repeat2,
    },
    {
      id: "reaction" as keyof UserMuteStatus,
      addText: `${$_("mute.reaction.add")}`,
      removeText: `${$_("mute.reaction.remove")}`,
      Icon: SmilePlus,
    },
    {
      id: "zap" as keyof UserMuteStatus,
      addText: `${$_("mute.zap.add")}`,
      removeText: `${$_("mute.zap.remove")}`,
      Icon: Zap,
    },
  ];

  let muteStatus = $derived(
    $mutes || $mutebykinds ? userMuteStatus(pubkey) : undefined
  );

  let dialogOpen: (bool: boolean) => void = $state(() => {});

  let kind: number | undefined;
  let dtag: string | undefined;
  let title: string = $state("");
  let text: string = $state("");
  function reset() {
    kind = undefined;
    dtag = undefined;
  }
  //非公開ミュートのこと忘れてるよ
  //add
  async function handleAddMute(id: string) {
    reset();
    console.log("add", id);
    $nowProgress = true;
    if (id === "user") {
      //10000の最新データを取得
      //りすとにpubkey が入っているか確認
      //入ってなかったら追加
      //データを更新
      let kind10000 = await refetchKind10000();
      console.log(kind10000);
      if (!kind10000) {
        //データないけど新しく作っていいですか
        kind = 10000;
        dtag = undefined;
        title = `${$_("create.kind10000.title")}`;
        text = `${$_("create.kind10000.text")}`;
        $nowProgress = false;

        dialogOpen?.(true);
        return;
      }
      //新しいリストにほんとに含まれてないか確認
      const privateTags = await decryptContent(kind10000);
      const check = [...(privateTags ?? []), ...kind10000.tags].find(
        (tag) => tag[0] === "p" && tag.length > 1 && tag[1] === pubkey
      );
      if (!check) {
        //含まれてなかったたらデータを更新してpublishしてから
        //privateに追加する
        let newTags = privateTags ?? [];

        newTags.push(["p", pubkey]);
        const newEvPara: Nostr.EventParameters = {
          kind: kind10000.kind,
          pubkey: lumiSetting.get().pubkey,
          tags: kind10000.tags,
          content: (await encryptPrvTags(kind10000.pubkey, newTags)) ?? "",
        };

        const result = await safePublishEvent(newEvPara);
        if ("errorCode" in result) {
          if (result.isCanceled) {
            return; // キャンセル時は何もしない
          }
          $toastSettings = {
            title: "Error",
            description: $_(result.errorCode),
            color: "bg-red-500",
          };
          return;
        }

        // 成功時の処理
        const { event: ev, res } = result;
        const isSuccess = res
          .filter((item) => item.ok)
          .map((item) => item.from);
        console.log(isSuccess);
        if (isSuccess.length <= 0) {
          //しっぱい
          $toastSettings = {
            title: "Error",
            description: "Failed to add mute",
            color: "bg-red-500",
          };
          $nowProgress = false;

          return;
        }
        //最新の更新
        kind10000 = ev;
      }
      //localStorageのデータを新しいのにする。
      $mutes = {
        list: await toMuteList(kind10000),
        updated: Math.floor(Date.now() / 1000),
        event: kind10000,
      };
      // $mutes = $mutes;
      try {
        localStorage.setItem("lumiMute", JSON.stringify($mutes));
      } catch (error) {
        console.log("failed to save localStorage");
      }
      $nowProgress = false;
    } else if (id === "repost") {
      kind = 30007;
      dtag = "6";
      ///kind:30007 の dtag 6 の最新を取得
      let kind30007 = await refetchKind30007(dtag);
      console.log(kind30007);
      if (!kind30007) {
        //データないけど新しく作っていいですか

        title = `${$_("create.kind30007.6.title")}`;
        text = `${$_("create.kind30007.6.text")}`;
        $nowProgress = false;

        dialogOpen?.(true);
        return;
      }
      //新しいリストにほんとに含まれてないか確認
      const privateTags = await decryptContent(kind30007);
      const check = [...(privateTags ?? []), ...kind30007.tags].find(
        (tag) => tag[0] === "p" && tag.length > 1 && tag[1] === pubkey
      );
      let newTags = privateTags ?? [];
      if (!check) {
        //含まれてなかったたらデータを更新してpublishしてから
        //privateに追加する

        newTags.push(["p", pubkey]);
        const newEvPara: Nostr.EventParameters = {
          kind: kind30007.kind,
          pubkey: lumiSetting.get().pubkey,
          tags: kind30007.tags,
          content: (await encryptPrvTags(kind30007.pubkey, newTags)) ?? "",
        };
        const result = await safePublishEvent(newEvPara);
        if ("errorCode" in result) {
          if (result.isCanceled) {
            return; // キャンセル時は何もしない
          }
          $toastSettings = {
            title: "Error",
            description: $_(result.errorCode),
            color: "bg-red-500",
          };
          return;
        }
        // 成功時の処理
        const { event: ev, res } = result;
        const isSuccess = res
          .filter((item) => item.ok)
          .map((item) => item.from);
        console.log(isSuccess);
        if (isSuccess.length <= 0) {
          //しっぱい
          $toastSettings = {
            title: "Error",
            description: "Failed to add mute",
            color: "bg-red-500",
          };
          $nowProgress = false;

          return;
        }
        //最新の更新
        kind30007 = ev;
      }
      //localStorageのデータを新しいのにする。
      console.log(kind30007);
      $mutebykinds = {
        list: updateMuteByList(
          [...kind30007.tags, ...newTags],
          kind30007,
          $mutebykinds.list
        ),
        updated: Math.floor(Date.now() / 1000),
      };
      // $mutebykinds = $mutebykinds;
      try {
        localStorage.setItem("lumiMuteByKind", JSON.stringify($mutebykinds));
      } catch (error) {
        console.log("failed to save localStorage");
      }
      $nowProgress = false;
    } else if (id === "reaction") {
      kind = 30007;
      dtag = "7";
      ///kind:30007 の dtag 7 の最新を取得
      let kind30007 = await refetchKind30007(dtag);
      console.log(kind30007);
      if (!kind30007) {
        //データないけど新しく作っていいですか

        title = `${$_("create.kind30007.7.title")}`;
        text = `${$_("create.kind30007.7.text")}`;

        $nowProgress = false;

        dialogOpen?.(true);

        return;
      }
      //新しいリストにほんとに含まれてないか確認
      const privateTags = await decryptContent(kind30007);
      const check = [...(privateTags ?? []), ...kind30007.tags].find(
        (tag) => tag[0] === "p" && tag.length > 1 && tag[1] === pubkey
      );
      let newTags = privateTags ?? [];
      if (!check) {
        //含まれてなかったたらデータを更新してpublishしてから
        //privateに追加する

        newTags.push(["p", pubkey]);
        const newEvPara: Nostr.EventParameters = {
          kind: kind30007.kind,
          pubkey: lumiSetting.get().pubkey,
          tags: kind30007.tags,
          content: (await encryptPrvTags(kind30007.pubkey, newTags)) ?? "",
        };
        const result = await safePublishEvent(newEvPara);
        if ("errorCode" in result) {
          if (result.isCanceled) {
            return; // キャンセル時は何もしない
          }
          $toastSettings = {
            title: "Error",
            description: $_(result.errorCode),
            color: "bg-red-500",
          };
          return;
        }
        // 成功時の処理
        const { event: ev, res } = result;
        const isSuccess = res
          .filter((item) => item.ok)
          .map((item) => item.from);
        console.log(isSuccess);
        if (isSuccess.length <= 0) {
          //しっぱい
          $toastSettings = {
            title: "Error",
            description: "Failed to add mute",
            color: "bg-red-500",
          };
          $nowProgress = false;

          return;
        }
        //最新の更新
        kind30007 = ev;
      }
      //localStorageのデータを新しいのにする。

      $mutebykinds = {
        list: updateMuteByList(
          [...kind30007.tags, ...newTags],
          kind30007,
          $mutebykinds.list
        ),
        updated: Math.floor(Date.now() / 1000),
      };
      // $mutebykinds = $mutebykinds;
      try {
        localStorage.setItem("lumiMuteByKind", JSON.stringify($mutebykinds));
      } catch (error) {
        console.log("failed to save localStorage");
      }
      $nowProgress = false;
    } else if (id === "zap") {
      kind = 30007;
      dtag = "9734";
      //kind:30007の dtag 3974 の最新を取得
      let kind30007 = await refetchKind30007(dtag);
      console.log(kind30007);
      if (!kind30007) {
        //データないけど新しく作っていいですか
        title = `${$_("create.kind30007.3974.title")}`;
        text = `${$_("create.kind30007.3974.text")}`;

        $nowProgress = false;

        dialogOpen?.(true);

        return;
      }
      //新しいリストにほんとに含まれてないか確認
      const privateTags = await decryptContent(kind30007);
      const check = [...(privateTags ?? []), ...kind30007.tags].find(
        (tag) => tag[0] === "p" && tag.length > 1 && tag[1] === pubkey
      );
      let newTags = privateTags ?? [];
      if (!check) {
        //含まれてなかったたらデータを更新してpublishしてから
        //privateに追加する

        newTags.push(["p", pubkey]);
        const newEvPara: Nostr.EventParameters = {
          kind: kind30007.kind,
          pubkey: lumiSetting.get().pubkey,
          tags: kind30007.tags,
          content: (await encryptPrvTags(kind30007.pubkey, newTags)) ?? "",
        };
        const result = await safePublishEvent(newEvPara);
        if ("errorCode" in result) {
          if (result.isCanceled) {
            return; // キャンセル時は何もしない
          }
          $toastSettings = {
            title: "Error",
            description: $_(result.errorCode),
            color: "bg-red-500",
          };
          return;
        }
        // 成功時の処理
        const { event: ev, res } = result;
        const isSuccess = res
          .filter((item) => item.ok)
          .map((item) => item.from);
        console.log(isSuccess);
        if (isSuccess.length <= 0) {
          //しっぱい
          $toastSettings = {
            title: "Error",
            description: "Failed to add mute",
            color: "bg-red-500",
          };
          $nowProgress = false;

          return;
        }
        //最新の更新
        kind30007 = ev;
      }
      //localStorageのデータを新しいのにする。

      $mutebykinds = {
        list: updateMuteByList(
          [...kind30007.tags, ...newTags],
          kind30007,
          $mutebykinds.list
        ),
        updated: Math.floor(Date.now() / 1000),
      };
      // $mutebykinds = $mutebykinds;
      try {
        localStorage.setItem("lumiMuteByKind", JSON.stringify($mutebykinds));
      } catch (error) {
        console.log("failed to save localStorage");
      }
      $nowProgress = false;
    }
    console.log($mutebykinds);
  }

  //remove
  async function handleRemoveMute(id: string) {
    $nowProgress = true;
    reset();
    console.log("remove", id);
    if (id === "user") {
      dtag = undefined;
      kind = 10000;
      //10000の最新データを取得
      let kind10000 = await refetchKind10000();
      console.log(kind10000);
      if (!kind10000) {
        $nowProgress = false;
        $toastSettings = {
          title: "Error",
          description: "Failed to remove mute",
          color: "bg-red-500",
        };
        return;
      }
      //新しいリストにほんとに含まれているか確認
      const privateTags = await decryptContent(kind10000);
      const check = [...(privateTags ?? []), ...kind10000.tags].find(
        (tag) => tag[0] === "p" && tag.length > 1 && tag[1] === pubkey
      );
      if (check) {
        //含まれていたらデータを更新してpublishしてから
        const newpubTags = kind10000.tags.filter(
          (tag) => !(tag[0] === "p" && tag.length > 1 && tag[1] === pubkey)
        );
        const newPrvTags = privateTags?.filter(
          (tag) => !(tag[0] === "p" && tag.length > 1 && tag[1] === pubkey)
        );
        const newEvPara: Nostr.EventParameters = {
          kind: kind10000.kind,
          pubkey: lumiSetting.get().pubkey,
          tags: newpubTags,
          content:
            (await encryptPrvTags(kind10000.pubkey, newPrvTags ?? [])) ?? "",
        };
        const result = await safePublishEvent(newEvPara);
        if ("errorCode" in result) {
          if (result.isCanceled) {
            return; // キャンセル時は何もしない
          }
          $toastSettings = {
            title: "Error",
            description: $_(result.errorCode),
            color: "bg-red-500",
          };
          return;
        }
        // 成功時の処理
        const { event: ev, res } = result;
        const isSuccess = res
          .filter((item) => item.ok)
          .map((item) => item.from);
        console.log(isSuccess);
        if (isSuccess.length <= 0) {
          //しっぱい
          $toastSettings = {
            title: "Error",
            description: "Failed to remove mute",
            color: "bg-red-500",
          };
          $nowProgress = false;

          return;
        }
        //最新の更新
        kind10000 = ev;
      }
      //localStorageのデータを新しいのにする。
      $mutes = {
        list: await toMuteList(kind10000),
        updated: Math.floor(Date.now() / 1000),
        event: kind10000,
      };
      // $mutes = $mutes;
      try {
        localStorage.setItem("lumiMute", JSON.stringify($mutes));
      } catch (error) {
        console.log("failed to save localStorage");
      }
      $nowProgress = false;
    } else if (id === "repost") {
      dtag = "6";
      kind = 30007;
      ///kind:30007 の dtag 6 の最新を取得
      let kind30007 = await refetchKind30007(dtag);
      console.log(kind30007);
      if (!kind30007) {
        $nowProgress = false;
        $toastSettings = {
          title: "Error",
          description: "Failed to remove mute",
          color: "bg-red-500",
        };
        return;
      }
      //新しいリストにほんとに含まれているか確認
      const privateTags = await decryptContent(kind30007);
      const check = [...(privateTags ?? []), ...kind30007.tags].find(
        (tag) => tag[0] === "p" && tag.length > 1 && tag[1] === pubkey
      );

      //含まれていたらデータを更新してpublishしてから
      const newpubTags = kind30007.tags.filter(
        (tag) => !(tag[0] === "p" && tag.length > 1 && tag[1] === pubkey)
      );
      const newPrvTags = privateTags?.filter(
        (tag) => !(tag[0] === "p" && tag.length > 1 && tag[1] === pubkey)
      );

      if (check) {
        const newEvPara: Nostr.EventParameters = {
          kind: kind30007.kind,
          pubkey: lumiSetting.get().pubkey,
          tags: newpubTags,
          content:
            (await encryptPrvTags(kind30007.pubkey, newPrvTags ?? [])) ?? "",
        };
        const result = await safePublishEvent(newEvPara);
        if ("errorCode" in result) {
          if (result.isCanceled) {
            return; // キャンセル時は何もしない
          }
          $toastSettings = {
            title: "Error",
            description: $_(result.errorCode),
            color: "bg-red-500",
          };
          return;
        }
        // 成功時の処理
        const { event: ev, res } = result;
        const isSuccess = res
          .filter((item) => item.ok)
          .map((item) => item.from);
        console.log(isSuccess);
        if (isSuccess.length <= 0) {
          //しっぱい
          $toastSettings = {
            title: "Error",
            description: "Failed to remove mute",
            color: "bg-red-500",
          };
          $nowProgress = false;

          return;
        }
        //最新の更新
        kind30007 = ev;
      }
      //localStorageのデータを新しいのにする。

      $mutebykinds = {
        list: updateMuteByList(
          [...newpubTags, ...(newPrvTags ?? [])],
          kind30007,
          $mutebykinds.list
        ),
        updated: Math.floor(Date.now() / 1000),
      };
      // $mutebykinds = $mutebykinds;
      try {
        localStorage.setItem("lumiMuteByKind", JSON.stringify($mutebykinds));
      } catch (error) {
        console.log("failed to save localStorage");
      }
      $nowProgress = false;
    } else if (id === "reaction") {
      ///kind:30007 の dtag 7 の最新を取得
      dtag = "7";
      kind = 30007;
      let kind30007 = await refetchKind30007(dtag);
      console.log(kind30007);
      if (!kind30007) {
        $nowProgress = false;
        $toastSettings = {
          title: "Error",
          description: "Failed to remove mute",
          color: "bg-red-500",
        };
        return;
      }
      //新しいリストにほんとに含まれているか確認
      const privateTags = await decryptContent(kind30007);
      const check = [...(privateTags ?? []), ...kind30007.tags].find(
        (tag) => tag[0] === "p" && tag.length > 1 && tag[1] === pubkey
      );
      //含まれていたらデータを更新してpublishしてから
      const newpubTags = kind30007.tags.filter(
        (tag) => !(tag[0] === "p" && tag.length > 1 && tag[1] === pubkey)
      );
      const newPrvTags = privateTags?.filter(
        (tag) => !(tag[0] === "p" && tag.length > 1 && tag[1] === pubkey)
      );
      if (check) {
        const newEvPara: Nostr.EventParameters = {
          kind: kind30007.kind,
          pubkey: lumiSetting.get().pubkey,
          tags: newpubTags,
          content:
            (await encryptPrvTags(kind30007.pubkey, newPrvTags ?? [])) ?? "",
        };
        const result = await safePublishEvent(newEvPara);
        if ("errorCode" in result) {
          if (result.isCanceled) {
            return; // キャンセル時は何もしない
          }
          $toastSettings = {
            title: "Error",
            description: $_(result.errorCode),
            color: "bg-red-500",
          };
          return;
        }
        // 成功時の処理
        const { event: ev, res } = result;
        const isSuccess = res
          .filter((item) => item.ok)
          .map((item) => item.from);
        console.log(isSuccess);
        if (isSuccess.length <= 0) {
          //しっぱい
          $toastSettings = {
            title: "Error",
            description: "Failed to  remove mute",
            color: "bg-red-500",
          };
          $nowProgress = false;

          return;
        }
        //最新の更新
        kind30007 = ev;
      }
      //localStorageのデータを新しいのにする。

      $mutebykinds = {
        list: updateMuteByList(
          [...newpubTags, ...(newPrvTags ?? [])],
          kind30007,
          $mutebykinds.list
        ),
        updated: Math.floor(Date.now() / 1000),
      };
      // $mutebykinds = $mutebykinds;
      try {
        localStorage.setItem("lumiMuteByKind", JSON.stringify($mutebykinds));
      } catch (error) {
        console.log("failed to save localStorage");
      }
      $nowProgress = false;
    } else if (id === "zap") {
      dtag = "9734";
      kind = 30007;
      //kind:30007の dtag 3974 の最新を取得
      let kind30007 = await refetchKind30007(dtag);
      console.log(kind30007);
      if (!kind30007) {
        $nowProgress = false;
        $toastSettings = {
          title: "Error",
          description: "Failed to remove mute",
          color: "bg-red-500",
        };
        return;
      }
      //新しいリストにほんとに含まれているか確認
      const privateTags = await decryptContent(kind30007);
      const check = [...(privateTags ?? []), ...kind30007.tags].find(
        (tag) => tag[0] === "p" && tag.length > 1 && tag[1] === pubkey
      );

      //含まれていたらデータを更新してpublishしてから
      const newpubTags = kind30007.tags.filter(
        (tag) => !(tag[0] === "p" && tag.length > 1 && tag[1] === pubkey)
      );
      const newPrvTags = privateTags?.filter(
        (tag) => !(tag[0] === "p" && tag.length > 1 && tag[1] === pubkey)
      );

      if (check) {
        const newEvPara: Nostr.EventParameters = {
          kind: kind30007.kind,
          pubkey: lumiSetting.get().pubkey,
          tags: newpubTags,
          content:
            (await encryptPrvTags(kind30007.pubkey, newPrvTags ?? [])) ?? "",
        };
        const result = await safePublishEvent(newEvPara);
        if ("errorCode" in result) {
          if (result.isCanceled) {
            return; // キャンセル時は何もしない
          }
          $toastSettings = {
            title: "Error",
            description: $_(result.errorCode),
            color: "bg-red-500",
          };
          return;
        }
        // 成功時の処理
        const { event: ev, res } = result;
        const isSuccess = res
          .filter((item) => item.ok)
          .map((item) => item.from);
        console.log(isSuccess);
        if (isSuccess.length <= 0) {
          //しっぱい
          $toastSettings = {
            title: "Error",
            description: "Failed to remove mute",
            color: "bg-red-500",
          };
          $nowProgress = false;

          return;
        }
        //最新の更新
        kind30007 = ev;
      }
      //localStorageのデータを新しいのにする。

      $mutebykinds = {
        list: updateMuteByList(
          [...newpubTags, ...(newPrvTags ?? [])],
          kind30007,
          $mutebykinds.list
        ),
        updated: Math.floor(Date.now() / 1000),
      };
      // $mutebykinds = $mutebykinds;
      try {
        localStorage.setItem("lumiMuteByKind", JSON.stringify($mutebykinds));
      } catch (error) {
        console.log("failed to save localStorage");
      }
      $nowProgress = false;
    }
  }

  async function refetchKind30007(
    dtag: string
  ): Promise<Nostr.Event | undefined> {
    const kind30007 = await usePromiseReq(
      {
        filters: [
          {
            kinds: [30007],
            authors: [lumiSetting.get().pubkey],
            "#d": [dtag],
            limit: 1,
          },
        ],
        operator: pipe(latest()),
      },
      undefined,
      2000
    );
    const localData = $mutebykinds?.list?.find(
      (li) => li.kind === Number(dtag)
    );

    if (
      kind30007.length > 0 &&
      (!localData?.event ||
        kind30007[0].event.created_at >= localData.event.created_at)
    ) {
      return kind30007[0].event;
    } else {
      return localData?.event;
    }
  }

  async function handleClickOk() {
    //データないけど新しく作っていいよのとこ
    console.log("kind", kind, "dtag", dtag);
    dialogOpen?.(false);
    if (!kind) {
      $toastSettings = {
        title: "Error",
        description: "",
        color: "bg-red-500",
      };
      $nowProgress = false;

      return;
    }
    $nowProgress = true;
    const newPubTag: string[][] = dtag ? [["d", dtag]] : [];
    const newPrvTag: string[][] = [["p", pubkey]];

    const newEvPara: Nostr.EventParameters = {
      kind: kind,
      pubkey: lumiSetting.get().pubkey,
      tags: newPubTag,
      content:
        (await encryptPrvTags(lumiSetting.get().pubkey, newPrvTag)) ?? "",
    };

    const result = await safePublishEvent(newEvPara);
    if ("errorCode" in result) {
      if (result.isCanceled) {
        return; // キャンセル時は何もしない
      }
      $toastSettings = {
        title: "Error",
        description: $_(result.errorCode),
        color: "bg-red-500",
      };
      return;
    }
    // 成功時の処理
    const { event: ev, res } = result;
    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
    console.log(isSuccess);
    if (isSuccess.length <= 0) {
      //しっぱい
      $toastSettings = {
        title: "Error",
        description: "Failed to remove mute",
        color: "bg-red-500",
      };
      $nowProgress = false;

      return;
    }

    if (kind === 10000) {
      //localStorageのデータを新しいのにする。
      $mutes = {
        list: await toMuteList(ev),
        updated: Math.floor(Date.now() / 1000),
        event: ev,
      };
      // $mutes = $mutes;
      try {
        localStorage.setItem("lumiMute", JSON.stringify($mutes));
      } catch (error) {
        console.log("failed to save localStorage");
      }
      $nowProgress = false;
    } else {
      //localStorageのデータを新しいのにする。

      $mutebykinds = {
        list: updateMuteByList(newPrvTag, ev, $mutebykinds.list),
        updated: Math.floor(Date.now() / 1000),
      };
      // $mutebykinds = $mutebykinds;
      try {
        localStorage.setItem("lumiMuteByKind", JSON.stringify($mutebykinds));
      } catch (error) {
        console.log("failed to save localStorage");
      }
      $nowProgress = false;
    }
  }
</script>

<button use:melt={$trigger}>{@render children?.()}</button>

{#if $open}
  <div
    use:melt={$content}
    transition:fade={{ duration: 100 }}
    class=" z-20 rounded-lg bg-white shadow"
  >
    <div
      class="flex flex-col flex-wrap divide-y divide-zinc-500 bg-zinc-800 border border-zinc-100 rounded-md w-64 max-w-full p-1"
    >
      {#each muteMenu as { id, addText, removeText, Icon }}
        {#if !muteStatus?.[id]}
          <button
            onclick={() => handleAddMute(id)}
            class="
     flex
     font-medium leading-none bg-neutral-800 text-magnum-300 hover:bg-magnum-500/25 active:opacity-50 disabled:opacity-15 py-1 items-center"
          >
            <Icon class="mx-1" />{addText}
          </button>
        {:else}
          <button
            onclick={() => handleRemoveMute(id)}
            class="flex
     font-medium leading-none bg-neutral-700 text-magnum-300 hover:bg-magnum-400/25 active:opacity-50 disabled:opacity-15 py-1 items-center"
          >
            <div class="relative mx-1">
              <!-- アイコン部分に取り消し線 -->
              <Slash
                strokeWidth={3}
                class="absolute left-0 right-0 stroke-magnum-500/80 rotate-90"
              />
              <Icon />
            </div>
            {removeText}
          </button>
        {/if}
      {/each}
    </div>
  </div>
{/if}
<AlertDialog
  bind:openDialog={dialogOpen}
  onClickOK={handleClickOk}
  {title}
  okButtonName="OK"
  >{#snippet main()}
    <div>{text}</div>
  {/snippet}</AlertDialog
>
