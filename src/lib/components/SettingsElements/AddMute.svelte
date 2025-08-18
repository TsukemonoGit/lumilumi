<script lang="ts">
  import { createSelect, melt } from "@melt-ui/svelte";
  import { Check, ChevronDown } from "lucide-svelte";
  import { fade } from "svelte/transition";

  import { t as _ } from "@konemono/svelte5-i18n";
  import * as nip19 from "nostr-tools/nip19";
  import { mutes, nowProgress, toastSettings } from "$lib/stores/stores";
  import { refetchKind10000 } from "$lib/func/mute";
  import AlertDialog from "../Elements/AlertDialog.svelte";

  import * as Nostr from "nostr-typedef";
  import {
    decryptContent,
    encryptPrvTags,
    toMuteList,
  } from "$lib/func/settings";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { safePublishEvent } from "$lib/func/publishError";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";

  let muteInput: string = $state("");

  const options = ["Word", "Hashtag", "User", "Thread"];

  const {
    elements: { trigger, menu, option, group, groupLabel, label },
    states: { selectedLabel, open },
    helpers: { isSelected },
  } = createSelect<string>({
    forceVisible: true,
    positioning: {
      placement: "bottom",
      fitViewport: true,
      sameWidth: true,
    },
  });

  // svelte-ignore non_reactive_update
  let dialogOpen: (bool: boolean) => void = () => {};
  let addTag: string[] = [];
  async function handleClickAdd() {
    console.log("[type]", $selectedLabel, "[str]", muteInput);
    if (muteInput === "") {
      return;
    }
    $nowProgress = true;
    switch ($selectedLabel) {
      case "Thread":
        //idチェック
        if (muteInput.startsWith("nostr:")) {
          muteInput = muteInput.slice(6);
        }
        //とりあえずHexはなしで
        try {
          const decoded = nip19.decode(muteInput);
          if (decoded.type === "note") {
            addTag = ["e", decoded.data];
          } else if (decoded.type === "nevent") {
            addTag = ["e", decoded.data.id];
          }
        } catch (error) {
          console.log("docode error");
        }

        break;

      case "User":
        //pubkeyチェック
        if (muteInput.startsWith("nostr:")) {
          muteInput = muteInput.slice(6);
        }
        try {
          const decoded = nip19.decode(muteInput);
          if (decoded.type === "npub") {
            addTag = ["p", decoded.data];
          } else if (decoded.type === "nprofile") {
            addTag = ["p", decoded.data.pubkey];
          }
        } catch (error) {
          console.log("error: failed to decode");
        }

        break;
      case "Hashtag":
        //先頭に#がついてたら外す lowercase にする
        if (muteInput.startsWith("#")) {
          muteInput = muteInput.slice(1);
        }
        addTag = ["t", muteInput.toLowerCase()];

        break;

      case "Word":
        //tokuninasi
        addTag = ["word", muteInput];
    }
    console.log(addTag);
    if (addTag.length <= 1) {
      $toastSettings = {
        title: "Error",
        description: "check your input",
        color: "bg-red-500",
      };
      return;
    }

    //最新のミュートリストを探す
    let kind10000 = await refetchKind10000();
    if (!kind10000) {
      //データないけど新しく作っていいですか

      $nowProgress = false;

      dialogOpen?.(true);
      return;
    }
    //本当に含まれていないか探す
    const privateTags = await decryptContent(kind10000);
    const check = [...(privateTags ?? []), ...kind10000.tags].find(
      (tag) => tag[0] === addTag[0] && tag.length > 1 && tag[1] === addTag[1]
    );
    if (!check) {
      //含まれてなかったたらデータを更新してpublishしてから
      //privateに追加する
      let newTags = privateTags ?? [];

      newTags.push(addTag);
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
      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
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

    //ローカルストレージを更新する
    //localStorageのデータを新しいのにする。
    $mutes = {
      list: await toMuteList(kind10000),
      updated: Math.floor(Date.now() / 1000),
      event: kind10000,
    };
    // $mutes = $mutes;
    try {
      localStorage.setItem(STORAGE_KEYS.LUMI_MUTE, JSON.stringify($mutes));
    } catch (error) {
      console.log("failed to save localStorage");
    }
    $nowProgress = false;
  }

  async function handleClickOk() {
    dialogOpen?.(false);

    if (addTag.length <= 0) {
      $toastSettings = {
        title: "Error",
        description: "",
        color: "bg-red-500",
      };
      $nowProgress = false;
    }
    const newEvPara: Nostr.EventParameters = {
      kind: 10000,
      pubkey: lumiSetting.get().pubkey,
      tags: [],
      content: (await encryptPrvTags(lumiSetting.get().pubkey, [addTag])) ?? "",
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

    addTag = [];
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
    $mutes = {
      list: await toMuteList(ev),
      updated: Math.floor(Date.now() / 1000),
      event: ev,
    };
    // $mutes = $mutes;
    try {
      localStorage.setItem(STORAGE_KEYS.LUMI_MUTE, JSON.stringify($mutes));
    } catch (error) {
      console.log("failed to save localStorage");
    }
    $nowProgress = false;
  }
</script>

<div class="flex flex-wrap gap-1 mb-2">
  <button
    class="w-40 flex h-10 items-center justify-between rounded-lg bg-neutral-800 px-3 py-2
  text-magnum-200 shadow transition-opacity hover:opacity-90"
    use:melt={$trigger}
    aria-label="mute"
  >
    {$selectedLabel || `${$_("mute.type.select")}`}
    <ChevronDown class="size-5" />
  </button>
  {#if $open}
    <div
      class=" z-50 flex max-h-[300px] flex-col
    overflow-y-auto rounded-lg bg-neutral-800 p-1
    shadow focus:!ring-0"
      use:melt={$menu}
      transition:fade={{ duration: 150 }}
    >
      {#each options as item}
        <div
          class="relative cursor-pointer rounded-lg py-1 pl-8 pr-4 text-neutral-200
              hover:bg-magnum-100 focus:z-10
              focus:text-magnum-200
              data-[highlighted]:bg-magnum-700 data-[highlighted]:text-magnum-100
              data-[disabled]:opacity-50"
          use:melt={$option({ value: item, label: item })}
        >
          <div class="check {$isSelected(item) ? 'block' : 'hidden'}">
            <Check class="size-4" />
          </div>

          {item}
        </div>
      {/each}
    </div>
  {/if}

  <input
    type="text"
    class=" rounded-md px-3 py-2 border border-magnum-300 disabled:opacity-25"
    placeholder={`mute ${$selectedLabel !== "Thread" ? $selectedLabel : "NoteID"}`}
    disabled={!$selectedLabel}
    bind:value={muteInput}
  />
  <button
    onclick={handleClickAdd}
    class=" rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
    >ADD</button
  >
</div>
<AlertDialog
  bind:openDialog={dialogOpen}
  onClickOK={handleClickOk}
  title={$_("create.kind10000.title")}
  okButtonName="OK"
  >{#snippet main()}
    <div>{$_("create.kind10000.text")}</div>
  {/snippet}</AlertDialog
>

<style lang="postcss">
  .check {
    position: absolute;
    left: theme(spacing.2);
    top: 50%;
    z-index: theme(zIndex.20);
    translate: 0 calc(-50% + 1px);
    color: theme(colors.magnum.400);
  }
</style>
