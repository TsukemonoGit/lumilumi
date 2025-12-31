<script lang="ts">
  import { emojis, nowProgress } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";

  import Avatar from "svelte-boring-avatars";
  import { usePromiseReq } from "$lib/func/nostr";
  import { latest } from "rx-nostr";
  import { pipe } from "rxjs";
  import { createEmojiListFrom10030 } from "$lib/func/settings";
  import { t as _ } from "@konemono/svelte5-i18n";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import ClientTag from "../../content/ClientTag.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { SmilePlus, Trash2 } from "lucide-svelte";
  import { validateLoginPubkey } from "$lib/func/validateLoginPubkey";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import { checkContentWarning } from "$lib/func/event";
  import CustomEmoji from "../../content/CustomEmoji.svelte";
  import { safePublishEvent } from "$lib/func/publishError";
  import { TokenType, type Token } from "@konemono/nostr-content-parser";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { updateEmojiListFromEvent } from "$lib/func/updateEmojiList";
  import { addToast } from "$lib/components/Elements/Toast.svelte";

  interface Props {
    note: Nostr.Event;
    repostable: boolean;
    maxHeight: number | undefined;

    displayMenu: boolean;
    mini?: boolean;
    metadata: Nostr.Event | undefined;
    depth: number;
    showStatus?: boolean;
  }

  let deleted = $state(false);
  let {
    note,
    repostable,
    maxHeight,

    displayMenu,
    mini,
    metadata,
    showStatus = true,
    depth,
  }: Props = $props();
  let dtag = $derived(note?.tags?.find((tag) => tag[0] === "d")?.[1]);
  let title = $derived(note?.tags?.find((tag) => tag[0] === "title")?.[1]);
  let description = $derived(
    note.tags.find(
      (tag) =>
        (tag[0] === "description" || tag[0] === "summary") && tag.length > 1
    )?.[1]
  );
  let image = $derived(
    note.tags.find((tag) => tag[0] === "image" && tag.length > 1)?.[1]
  );
  let atag = $derived(`${note.kind}:${note.pubkey}:${dtag}`);
  //このカスタム絵文字が10030に含まれるかチェック
  let inMyCustomEmoji = $derived(
    $emojis.event?.tags.find(
      (tag) => tag[0] === "a" && tag.length > 1 && tag[1] === atag
    )
  );

  // svelte-ignore non_reactive_update
  let dialogOpen: (bool: boolean) => void = () => {};

  // Public key validation
  const CheckLoginPubkey = async (): Promise<boolean> => {
    const res = await validateLoginPubkey();
    if (res.status) {
      return true;
    } else if (res.message) {
      addToast({
        data: {
          title: "Error",
          description: res.message,
          color: "bg-red-500",
        },
      });
    }
    return false;
  };

  async function handleClickMakeKind10030() {
    //追加押してfetchしてデータなかったときにここだからすでにlogin signチェックされてるはず
    // const checkPub = await CheckLoginPubkey();
    // if (!checkPub) {
    //   return;
    // }
    console.log("make new 10030");
    dialogOpen?.(false);
    $nowProgress = true;
    disabled = true;

    const newEvPara: Nostr.EventParameters = {
      kind: 10030,
      pubkey: lumiSetting.get().pubkey,
      tags: [["a", atag]],
      content: "",
    };

    try {
      const result = await safePublishEvent(newEvPara);

      if ("errorCode" in result) {
        if (result.isCanceled) {
          return; // キャンセル時は何もしない
        }
        addToast({
          data: {
            title: "Error",
            description: $_(result.errorCode),
            color: "bg-red-500",
          },
        });
        return;
      }

      // 成功時の処理
      const { event: ev, res } = result;
      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);

      if (isSuccess.length <= 0) {
        //失敗
        addToast({
          data: {
            title: "Error",
            description: "Failed to add emoji",
            color: "bg-red-500",
          },
        });
        return;
      }

      // 成功時の処理
      const list = await createEmojiListFrom10030(ev);
      $emojis = {
        list: list,
        updated: Math.floor(Date.now() / 1000),
        event: ev,
      };
      $emojis = $emojis;
      localStorage.setItem(STORAGE_KEYS.LUMI_EMOJI, JSON.stringify($emojis));
    } finally {
      $nowProgress = false;
      disabled = false;
    }
  }

  async function handleClickAdd() {
    const checkPub = await CheckLoginPubkey();
    if (!checkPub) {
      return;
    }
    console.log("myEmojiListに", atag, "を追加");
    $nowProgress = true;
    disabled = true;

    try {
      //最新の10030を取得
      let newestKind10030 = await refetchKind10030();
      if (!newestKind10030) {
        //データないけど新しく作っていいですかnoyatu
        dialogOpen?.(true);
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
          pubkey: lumiSetting.get().pubkey,
          tags: newTags,
          content: newestKind10030.content,
        };

        const result = await safePublishEvent(newEvPara);

        if ("errorCode" in result) {
          if (result.isCanceled) {
            return; // キャンセル時は何もしない
          }
          addToast({
            data: {
              title: "Error",
              description: $_(result.errorCode),
              color: "bg-red-500",
            },
          });
          return;
        }

        // 成功時の処理
        const { event: ev, res } = result;
        const isSuccess = res
          .filter((item) => item.ok)
          .map((item) => item.from);

        if (isSuccess.length <= 0) {
          addToast({
            data: {
              title: "Error",
              description: "Failed to add emoji",
              color: "bg-red-500",
            },
          });
          return;
        }
        //最新を更新
        newestKind10030 = ev;
      }

      await updateEmojiListFromEvent(newestKind10030);
    } finally {
      $nowProgress = false;
      disabled = false;
    }
  }

  let disabled = $state(false);

  async function handleClickRemove() {
    const checkPub = await CheckLoginPubkey();
    if (!checkPub) {
      return;
    }
    console.log("myEmojiListから", inMyCustomEmoji, "を削除");
    $nowProgress = true;
    disabled = true;
    let newestKind10030 = await refetchKind10030();
    if (!newestKind10030) {
      //削除ってことは追加されてるってことで初めてのデータじゃないからないってことはない
      $nowProgress = false;
      addToast({
        data: {
          title: "Error",
          description: "Failed to remove emoji",
          color: "bg-red-500",
        },
      });
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
        pubkey: lumiSetting.get().pubkey,
        tags: newTags,
        content: newestKind10030.content,
      };

      const result = await safePublishEvent(newEvPara);
      if ("errorCode" in result) {
        if (result.isCanceled) {
          return; // キャンセル時は何もしない
        }
        addToast({
          data: {
            title: "Error",
            description: $_(result.errorCode),
            color: "bg-red-500",
          },
        });
        return;
      }
      // 成功時の処理
      const { event: ev, res } = result;
      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
      if (isSuccess.length <= 0) {
        addToast({
          data: {
            title: "Error",
            description: "Failed to add emoji",
            color: "bg-red-500",
          },
        });
        $nowProgress = false;
        disabled = false;
        return;
      }
      newestKind10030 = ev;
    }

    await updateEmojiListFromEvent(newestKind10030);
    $nowProgress = false;
    disabled = false;
  }
  //今の同期されたデータと別ユーザーの可能性
  async function refetchKind10030(): Promise<Nostr.Event | undefined> {
    const kind10030 = await usePromiseReq(
      {
        filters: [
          { kinds: [10030], authors: [lumiSetting.get().pubkey], limit: 1 },
        ],
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
      return $state.snapshot($emojis.event);
    }
  }
  let warning = $derived(checkContentWarning(note?.tags));
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else if note}
  <NoteComponent
    warningText={warning !== undefined
      ? warning.length > 1
        ? warning[1]
        : ""
      : undefined}
    >{#snippet icon()}
      <UserPopupMenu
        pubkey={note.pubkey}
        {metadata}
        size={mini ? 20 : 40}
        {displayMenu}
        {depth}
      />
    {/snippet}
    {#snippet seenOn()}
      {#if lumiSetting.get().showRelayIcon && displayMenu}
        <SeenonIcons id={note.id} width={mini ? 20 : 40} />{/if}
    {/snippet}
    {#snippet name()}
      <ProfileDisplay
        pubkey={note.pubkey}
        kind={note.kind}
        {metadata}
        kindInfo={true}
      />
    {/snippet}
    {#snippet time()}
      <DisplayTime {displayMenu} {note} />
    {/snippet}
    {#snippet status()}
      {#if lumiSetting.get().showUserStatus && showStatus}<ShowStatus
          pubkey={note.pubkey}
        />{/if}
    {/snippet}

    {#snippet content()}
      <div class="grid grid-cols-[1fr_auto] w-full gap-1">
        <div>
          <span class="text-lg font-bold text-magnum-300">{title ?? dtag}</span
          >{#if description}
            <div class="text-sm text-neutral-300/80">{description}</div>{/if}
        </div>
        {#if image}
          {#if lumiSetting.get().showImg}
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
      <div class="flex gap-1 flex-wrap break-all">
        {#each note.tags.filter((tag) => tag[0] === "emoji") as [tag, shortcode, url]}
          <CustomEmoji
            part={{
              type: TokenType.CUSTOM_EMOJI,
              content: shortcode,
              metadata: { name: shortcode, url: url },
              start: 0,
              end: 0,
            } as Token}
          />
        {/each}<ClientTag depth={0} tags={note.tags} />
      </div>
      {#if lumiSetting.get().pubkey}
        {#if inMyCustomEmoji}
          <button
            disabled={$nowProgress || disabled}
            onclick={handleClickRemove}
            class="rounded-3xl w-fit p-2 bg-magnum-900/50 border border-magnum-200 ml-auto text-magnum-200 hover:opacity-75 active:opacity-50 disabled:opacity-15 flex gap-1 items-center"
            ><Trash2 />{$_("customEmoji.remove")}</button
          >
        {:else}
          <button
            onclick={handleClickAdd}
            disabled={$nowProgress || disabled}
            class="rounded-3xl w-fit p-2 bg-magnum-200 border border-magnum-900 ml-auto text-magnum-900 hover:opacity-75 active:opacity-50 disabled:opacity-15 flex gap-1 items-center"
            ><SmilePlus />{$_("customEmoji.add")}</button
          >
        {/if}{/if}
    {/snippet}
    {#snippet actionButtons()}
      {#if displayMenu}
        <NoteActionButtons {note} {repostable} bind:deleted />{/if}
    {/snippet}
  </NoteComponent>
{/if}
<AlertDialog
  bind:openDialog={dialogOpen}
  onClickOK={handleClickMakeKind10030}
  title={$_("create.10030.title")}
  okButtonName="OK"
  >{#snippet main()}
    <div>{$_("create.10030.text")}</div>
  {/snippet}</AlertDialog
>
