<script lang="ts">
  import {
    emojis,
    loginUser,
    nowProgress,
    showImg,
    toastSettings,
  } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";

  import ClientTag from "./ClientTag.svelte";
  import Avatar from "svelte-boring-avatars";
  import { promisePublishEvent, usePromiseReq } from "$lib/func/nostr";
  import { latest } from "rx-nostr";
  import { pipe } from "rxjs";
  import { createEmojiListFrom10030 } from "$lib/func/settings";
  import { _ } from "svelte-i18n";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import type {
    Invalidator,
    Subscriber,
    Unsubscriber,
    Updater,
  } from "svelte/store";

  export let note: Nostr.Event;
  export let repostable: boolean;
  export let maxHeight: string;
  export let tieKey: string | undefined;
  $: dtag = note?.tags?.find((tag) => tag[0] === "d")?.[1];
  $: title = note?.tags?.find((tag) => tag[0] === "title")?.[1];
  $: description = note.tags.find(
    (tag) =>
      (tag[0] === "description" || tag[0] === "summary") && tag.length > 1
  )?.[1];
  $: image = note.tags.find((tag) => tag[0] === "image" && tag.length > 1)?.[1];
  $: atag = `${note.kind}:${note.pubkey}:${dtag}`;
  //このカスタム絵文字が10030に含まれるかチェック
  $: inMyCustomEmoji = $emojis.event?.tags.find(
    (tag) => tag[0] === "a" && tag.length > 1 && tag[1] === atag
  );

  let dialogOpen: {
    update: (
      updater: Updater<boolean>,
      sideEffect?: ((newValue: boolean) => void) | undefined
    ) => void;
    set: (this: void, value: boolean) => void;
    subscribe(
      this: void,
      run: Subscriber<boolean>,
      invalidate?: Invalidator<boolean> | undefined
    ): Unsubscriber;
    get: () => boolean;
    destroy?: (() => void) | undefined;
  };

  async function handleClickMakeKind10030() {
    console.log("make new 10030");
    $dialogOpen = false;
    $nowProgress = true;
    disabled = true;

    const newEvPara: Nostr.EventParameters = {
      kind: 10030,
      pubkey: $loginUser,
      tags: [["a", atag]],
      content: "",
    };

    const { event: ev, res: res } = await promisePublishEvent(newEvPara);
    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);

    if (!isSuccess) {
      //失敗
      $toastSettings = {
        title: "Error",
        description: "Failed to add emoji",
        color: "bg-red-500",
      };
      $nowProgress = false;
      disabled = false;

      return;
    }
    $nowProgress = false;
    const list = await createEmojiListFrom10030(ev);
    $emojis = {
      list: list,
      updated: Math.floor(Date.now() / 1000),
      event: ev,
    };
    localStorage.setItem("lumiEmoji", JSON.stringify($emojis));
    disabled = false;
  }

  async function handleClickAdd() {
    console.log("myEmojiListに", atag, "を追加");
    $nowProgress = true;
    disabled = true;
    //最新の10030を取得
    let newestKind10030 = await refetchKind10030();
    if (!newestKind10030) {
      //------しっぱいじゃなくて　データないけど新しく作っていいですかを書く------
      $nowProgress = false;
      $dialogOpen = true;
      return;
    }
    //新しいリストにほんとに含まれてないか確認
    const check = newestKind10030.tags.find(
      (tag) => tag[0] === "a" && tag.length > 1 && tag[1] === atag
    );

    if (!check) {
      //含まれていなかったらデータを更新してpublishして
      const newTags = [...newestKind10030.tags];
      newTags.push(["a", atag]);
      const newEvPara: Nostr.EventParameters = {
        kind: 10030,
        pubkey: $loginUser,
        tags: newTags,
        content: newestKind10030.content,
      };

      const { event: ev, res: res } = await promisePublishEvent(newEvPara);
      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);

      if (!isSuccess) {
        $toastSettings = {
          title: "Error",
          description: "Failed to add emoji",
          color: "bg-red-500",
        };
        $nowProgress = false;
        disabled = false;
        return;
      }
      //最新を更新
      newestKind10030 = ev;
    }
    //localStorageのデータを新しいのにする。

    $nowProgress = false;
    const list = await createEmojiListFrom10030(newestKind10030);
    $emojis = {
      list: list,
      updated: Math.floor(Date.now() / 1000),
      event: newestKind10030,
    };
    localStorage.setItem("lumiEmoji", JSON.stringify($emojis));
    disabled = false;
  }
  let disabled = false;
  async function handleClickRemove() {
    console.log("myEmojiListから", inMyCustomEmoji, "を削除");
    $nowProgress = true;
    disabled = true;
    let newestKind10030 = await refetchKind10030();
    if (!newestKind10030) {
      //削除ってことは追加されてるってことで初めてのデータじゃないからないってことはない
      $nowProgress = false;
      $toastSettings = {
        title: "Error",
        description: "Failed to remove emoji",
        color: "bg-red-500",
      };
      return;
    }
    //新しいリストにほんとに含まれているか確認
    const check = newestKind10030?.tags.find(
      (tag) => tag[0] === "a" && tag.length > 1 && tag[1] === atag
    );

    if (check) {
      //含まれていたらデータを更新してpublishしてから
      const newTags = newestKind10030.tags.filter(
        (tag) => !(tag[0] === "a" && tag.length > 1 && tag[1] === atag)
      );
      const newEvPara: Nostr.EventParameters = {
        kind: 10030,
        pubkey: $loginUser,
        tags: newTags,
        content: newestKind10030.content,
      };
      const { event: ev, res: res } = await promisePublishEvent(newEvPara);

      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
      if (!isSuccess) {
        $toastSettings = {
          title: "Error",
          description: "Failed to add emoji",
          color: "bg-red-500",
        };
        $nowProgress = false;
        disabled = false;
        return;
      }
      newestKind10030 = ev;
    }
    //localStorageのデータを新しいのにする。
    $nowProgress = false;
    const list = await createEmojiListFrom10030(newestKind10030);
    $emojis = {
      list: list,
      updated: Math.floor(Date.now() / 1000),
      event: newestKind10030,
    };
    localStorage.setItem("lumiEmoji", JSON.stringify($emojis));
    disabled = false;
  }
  //今の同期されたデータと別ユーザーの可能性
  async function refetchKind10030(): Promise<Nostr.Event | undefined> {
    const kind10030 = await usePromiseReq(
      {
        filters: [{ kinds: [10030], authors: [$loginUser], limit: 1 }],
        operator: pipe(latest()),
      },
      undefined,
      2000
    );
    console.log("kind10030", kind10030);
    console.log("$emojis", $emojis.event);
    if (
      kind10030.length > 0 &&
      (!$emojis.event ||
        $emojis.event.pubkey !== kind10030[0].event.pubkey ||
        kind10030[0].event.created_at > $emojis.event.created_at)
    ) {
      return kind10030[0].event;
    } else {
      return $emojis.event;
    }
  }
</script>

<div class="flex flex-col w-full">
  <div class="grid grid-cols-[1fr_auto] w-full gap-1">
    <div>
      Emoji set: <span class="text-lg font-bold text-magnum-400"
        >{title ?? dtag}</span
      >{#if description}
        <div class=" text-neutral-300/80">{description}</div>{/if}
    </div>
    {#if image}
      {#if $showImg}
        <img
          loading="lazy"
          src={image}
          alt=""
          class="max-w-16 object-contain max-h-16"
        />{:else}<Avatar
          size={64}
          name={image}
          variant="beam"
          square={true}
        />{/if}{/if}
  </div>
  <div class="flex gap-1 flex-wrap" style="max-height:{maxHeight ?? 'none'}">
    {#each note.tags.filter((tag) => tag[0] === "emoji") as [tag, shortcode, url]}
      {#if $showImg}
        <img
          loading="lazy"
          alt={shortcode}
          src={url}
          class="inline h-[24px] object-contain m-0 overflow-hidden"
        />
      {:else}
        <div>:{shortcode}:</div>
      {/if}
    {/each}<ClientTag tags={note.tags} />
  </div>
  {#if inMyCustomEmoji}
    <button
      disabled={$nowProgress || disabled}
      on:click={handleClickRemove}
      class="rounded-3xl w-fit p-2 bg-magnum-900/50 border border-magnum-200 ml-auto text-magnum-200 hover:opacity-75 active:opacity-50 disabled:opacity-15"
      >{$_("customEmoji.remove")}</button
    >
  {:else}
    <button
      on:click={handleClickAdd}
      disabled={$nowProgress || disabled}
      class="rounded-3xl w-fit p-2 bg-magnum-200 border border-magnum-900 ml-auto text-magnum-900 hover:opacity-75 active:opacity-50 disabled:opacity-15"
      >{$_("customEmoji.add")}</button
    >
  {/if}
  <NoteActionButtons {note} {repostable} {tieKey} />
</div>

<AlertDialog
  bind:open={dialogOpen}
  onClickOK={handleClickMakeKind10030}
  title={$_("create.10030.title")}
  okButtonName="OK"
  ><div slot="main">{$_("create.10030.text")}</div></AlertDialog
>
