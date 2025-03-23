<script lang="ts">
  import { _ } from "svelte-i18n";

  import { X } from "lucide-svelte";
  import { Tabs } from "melt/builders";
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
    toMuteList,
    decryptContent,
    encryptPrvTags,
  } from "$lib/func/settings";
  import * as Nostr from "nostr-typedef";
  import { promisePublishEvent } from "$lib/func/nostr";

  let triggers = $derived([
    { id: "tab-1", title: `Word (${$mutes?.list.word.length})` },
    { id: "tab-2", title: `Hashtag (${$mutes?.list.t.length})` },
    { id: "tab-3", title: `User (${$mutes?.list.p.length})` },
    { id: "tab-4", title: `Thread (${$mutes?.list.e.length})` },
  ]);
  // svelte-ignore state_referenced_locally
  const tabIds = triggers.map((trigger) => trigger.id);
  const tabs = new Tabs({ value: tabIds[0] });
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
    localStorage.setItem("lumiMute", JSON.stringify($mutes));
    $nowProgress = false;
  }
</script>

<div
  class="flex w-full flex-col overflow-hidden xs:max-h-[23rem] max-h-[20rem] rounded-xl shadow-md data-[orientation=vertical]:flex-row mb-2"
>
  <div
    {...tabs.triggerList}
    class="flex shrink-0 overflow-y-auto
data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-r max-h-full overflow-auto bg-neutral-800 p-2"
  >
    {#each triggers as triggerItem}
      <button {...tabs.getTrigger(triggerItem.id)} class="trigger relative">
        {triggerItem.title}
        {#if tabs.value === triggerItem.id}
          <div
            in:send={{ key: "trigger" }}
            out:receive={{ key: "trigger" }}
            class="absolute bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-magnum-400"
          ></div>
        {/if}
      </button>
    {/each}
  </div>
  <div class="grow p-5">
    {#if tabs.value === tabIds[0]}
      <ul
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2"
      >
        {#each $mutes.list.word as word, index}
          <li>
            {word}
            <button
              class="remove"
              onclick={() => handleClickRemove(["word", word])}
              ><X size={20} /></button
            >
          </li>
        {/each}
      </ul>
    {/if}
    {#if tabs.value === tabIds[1]}
      <ul
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 w-full"
      >
        {#each $mutes.list.t as t, index}
          <li>
            {t}
            <button class="remove" onclick={() => handleClickRemove(["t", t])}
              ><X size={20} /></button
            >
          </li>
        {/each}
      </ul>
    {/if}
    {#if tabs.value === tabIds[2]}
      <ul
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2"
      >
        {#each $mutes.list.p as p, index}
          <li>
            {nip19.npubEncode(p)}
            <button class="remove" onclick={() => handleClickRemove(["p", p])}
              ><X size={20} /></button
            >
          </li>
        {/each}
      </ul>
    {/if}

    {#if tabs.value === tabIds[3]}
      <ul
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2"
      >
        {#each $mutes.list.e as e, index}
          <li>
            {nip19.noteEncode(e)}<button
              class="remove"
              onclick={() => handleClickRemove(["e", e])}
              ><X size={20} /></button
            >
          </li>
        {/each}
      </ul>
    {/if}
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
</style>
