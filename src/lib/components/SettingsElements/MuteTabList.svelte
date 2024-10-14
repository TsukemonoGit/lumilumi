<script lang="ts">
  import type { LumiMute } from "$lib/types";
  import { _ } from "svelte-i18n";

  import { X } from "lucide-svelte";
  import { createTabs, melt } from "@melt-ui/svelte";
  import { crossfade } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { nip19 } from "nostr-tools";
  import { refetchKind10000 } from "$lib/func/mute";
  import {
    loginUser,
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
  import * as Nostr from "nostr-typedef";
  import { promisePublishEvent } from "$lib/func/nostr";

  export let muteList: LumiMute;
  const {
    elements: { root, list, content, trigger },
    states: { value },
  } = createTabs({
    defaultValue: "tab-1",
  });
  const triggers = [
    { id: "tab-1", title: `Word (${muteList?.list.word.length})` },
    { id: "tab-2", title: `Hashtag (${muteList?.list.t.length})` },
    { id: "tab-3", title: `User (${muteList?.list.p.length})` },
    { id: "tab-4", title: `Event (${muteList?.list.e.length})` },
  ];
  const [send, receive] = crossfade({
    duration: 250,
    easing: cubicInOut,
  });

  async function handleClickRemove(removeTag: string[]) {
    console.log(removeTag);
    if (removeTag.length <= 1) {
      return;
    }

    $nowProgress = true;
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
      (tag) =>
        tag[0] === removeTag[0] && tag.length > 1 && tag[1] === removeTag[1]
    );
    if (check) {
      //含まれていたらデータを更新してpublishしてから
      const newpubTags = kind10000.tags.filter(
        (tag) =>
          !(
            tag[0] === removeTag[0] &&
            tag.length > 1 &&
            tag[1] === removeTag[1]
          )
      );
      const newPrvTags = privateTags?.filter(
        (tag) =>
          !(
            tag[0] === removeTag[0] &&
            tag.length > 1 &&
            tag[1] === removeTag[1]
          )
      );
      const newEvPara: Nostr.EventParameters = {
        kind: kind10000.kind,
        pubkey: $loginUser,
        tags: newpubTags,
        content:
          (await encryptPrvTags(kind10000.pubkey, newPrvTags ?? [])) ?? "",
      };
      const { event: ev, res: res } = await promisePublishEvent(newEvPara);
      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
      console.log(isSuccess);
      if (!isSuccess) {
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
    localStorage.setItem("lumiMute", JSON.stringify($mutes));
    $nowProgress = false;
    muteList = $mutes;
  }
</script>

<div
  use:melt={$root}
  class="flex w-full flex-col overflow-hidden max-h-[23rem] rounded-xl shadow-lg data-[orientation=vertical]:flex-row"
>
  <div
    use:melt={$list}
    class="flex shrink-0 overflow-y-auto
data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-r max-h-full overflow-auto"
  >
    {#each triggers as triggerItem}
      <button use:melt={$trigger(triggerItem.id)} class="trigger relative">
        {triggerItem.title}
        {#if $value === triggerItem.id}
          <div
            in:send={{ key: "trigger" }}
            out:receive={{ key: "trigger" }}
            class="absolute bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-magnum-400"
          />
        {/if}
      </button>
    {/each}
  </div>
  <div use:melt={$content("tab-1")} class="grow p-5">
    <ul
      class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2"
    >
      {#each muteList.list.word as word, index}
        <li>
          {word}
          <button
            class="remove"
            on:click={() => handleClickRemove(["word", word])}
            ><X size={20} /></button
          >
        </li>
      {/each}
    </ul>
  </div>
  <div use:melt={$content("tab-2")} class="grow p-5">
    <ul
      class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 w-full"
    >
      {#each muteList.list.t as t, index}
        <li>
          {t}
          <button class="remove" on:click={() => handleClickRemove(["t", t])}
            ><X size={20} /></button
          >
        </li>
      {/each}
    </ul>
  </div>
  <div use:melt={$content("tab-3")} class="grow p-5">
    <ul
      class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2"
    >
      {#each muteList.list.p as p, index}
        <li>
          {nip19.npubEncode(p)}
          <button class="remove" on:click={() => handleClickRemove(["p", p])}
            ><X size={20} /></button
          >
        </li>
      {/each}
    </ul>
  </div>

  <div use:melt={$content("tab-4")} class="grow p-5">
    <ul
      class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2"
    >
      {#each muteList.list.e as e, index}
        <li>
          {nip19.noteEncode(e)}<button
            class="remove"
            on:click={() => handleClickRemove(["e", e])}><X size={20} /></button
          >
        </li>
      {/each}
    </ul>
  </div>
</div>

<style lang="postcss">
  .grow {
    @apply overflow-y-auto bg-neutral-800;
  }
  ul {
    @apply divide-y divide-neutral-600 overflow-y-auto;
  }
  li {
    @apply flex  justify-between w-full my-0.5 items-center;
  }
  .remove {
    @apply rounded-full bg-magnum-600 w-6 h-6 flex my-auto justify-center items-center text-magnum-100 hover:opacity-75 active:opacity-50;
  }

  .trigger {
    display: flex;
    align-items: center;
    justify-content: center;

    cursor: default;
    user-select: none;

    border-radius: 0;
    background-color: theme(colors.neutral.800);

    color: theme(colors.neutral.100);
    font-weight: 500;
    line-height: 1;

    flex: 1;
    height: theme(spacing.12);
    padding-inline: theme(spacing.2);

    &:focus {
      position: relative;
    }

    &:focus-visible {
      @apply z-10 ring-2;
    }

    &[data-state="active"] {
      @apply focus:relative;
      background-color: theme(colors.neutral.800);
      color: theme("colors.magnum.300");
    }
  }

  input {
    height: theme(spacing.8);
    flex-shrink: 0;
    flex-grow: 1;
    border-top-left-radius: theme(borderRadius.md);
    border-top-right-radius: theme(borderRadius.md);
    border: 1px solid theme(colors.neutral.200);
    padding-inline: theme(spacing[2.5]);
    line-height: 1;
    color: theme(colors.neutral.900);

    &:focus {
      border-color: theme(colors.magnum.400);
    }
  }

  .save {
    display: inline-flex;
    height: theme(spacing.8);
    cursor: default;
    align-items: center;
    justify-content: center;
    border-radius: theme(borderRadius.md);
    background-color: theme(colors.magnum.200);
    padding-inline: theme(spacing.4);
    line-height: 1;
    font-weight: theme(fontWeight.semibold);
    color: theme(colors.magnum.900);
    @apply transition;

    &:hover {
      opacity: 0.75;
    }

    &:focus {
      @apply !ring-green-600;
    }
  }
</style>
