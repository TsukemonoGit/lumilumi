<!-- PollDialog.svelte -->
<script lang="ts">
  import { writable, type Writable } from "svelte/store";
  import { Select } from "melt/builders";
  import Dialog from "./Elements/Dialog.svelte";
  import { ChartBar, Check, Plus, X } from "lucide-svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { defaultRelays } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";
  import { nip07Signer } from "rx-nostr";
  import { promisePublishSignedEvent } from "$lib/func/nostr";
  import * as nip19 from "nostr-tools/nip19";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { clientTag } from "$lib/func/constants";
  import { addToast } from "./Elements/Toast.svelte";
  interface Props {
    onPolled: (id: string) => void;
  }

  let { onPolled }: Props = $props();

  let dialogOpen: Writable<boolean> = $state(writable(false));
  // アンケートのオプションを文字列の配列として管理
  let pollOptions = $state(["", ""]);
  const maxOption = 20;
  // 投票の期限を管理
  const expirationOptions = [
    { value: "300", label: `${$_("poll.lim.300")}` },
    { value: "1800", label: `${$_("poll.lim.1800")}` },
    { value: "3600", label: `${$_("poll.lim.3600")}` },
    { value: "21600", label: `${$_("poll.lim.21600")}` },
    { value: "86400", label: `${$_("poll.lim.86400")}` },
    { value: "259200", label: `${$_("poll.lim.259200")}` },
    { value: "604800", label: `${$_("poll.lim.604800")}` },
  ];
  type ExpirationOption = (typeof expirationOptions)[number]["value"];
  const select = new Select<ExpirationOption>(expirationOptions[4]);

  let title = $state("");
  // 複数選択可能かどうか
  let multipleChoice = $state(false);

  // 6桁のランダムIDを生成する関数
  function generateRandomId() {
    return Math.random().toString(36).substring(2, 8); // 6文字のランダムID
  }

  // オプションを追加
  function addOption() {
    if (pollOptions.length < maxOption) {
      pollOptions = [...pollOptions, ""];
    }
  }

  // オプションを削除
  function removeOption(index: number) {
    if (pollOptions.length > 2) {
      pollOptions = pollOptions.filter((_, i) => i !== index);
    }
  }

  // ダイアログが開いたときに状態をリセット
  /*   $: if ($dialogOpen) {
    resetForm();
  }
 */
  // フォームをリセットする関数
  function resetForm() {
    pollOptions = ["", ""];

    multipleChoice = false;
  }

  // アンケートを投稿
  async function submitPoll() {
    // 入力検証
    // 空の選択肢があるか確認
    const emptyOptions = pollOptions.filter((opt) => opt.trim() === "");
    if (!title) {
      addToast({
        data: {
          title: `${$_("poll.warning.title")}`,
          description: `${$_("poll.warning.pollTitle")}`,
          color: "bg-red-500",
        },
      });
      return;
    }
    if (emptyOptions.length > 0) {
      //  showErrorMessage('すべての選択肢にテキストを入力してください');
      addToast({
        data: {
          title: `${$_("poll.warning.title")}`,
          description: `${$_("poll.warning.description")}`,
          color: "bg-red-500",
        },
      });
      return;
    }

    // 選択肢に6桁のランダムIDを付与
    const optionsWithIds = pollOptions.map((opt) => ({
      id: generateRandomId(),
      text: opt.trim(),
    }));

    // IDの重複がないか確認（念のため）
    const uniqueIds = new Set(optionsWithIds.map((opt) => opt.id));
    if (uniqueIds.size !== optionsWithIds.length) {
      // 重複があればIDを再生成
      return submitPoll();
    }
    console.log(optionsWithIds);
    // ここでNostrイベントを作成して送信する処理を実装
    const pollData = {
      options: optionsWithIds,
      expiresIn: parseInt(select.value || ""),
      multipleChoice,
    };

    console.log("Poll data:", pollData);
    const writeRelays = $defaultRelays
      ? Object.values($defaultRelays).filter((config) => config.write)
      : [];

    const eventParam: Nostr.EventParameters = {
      kind: 1068, //投票,
      content: title,
      tags: [
        ...optionsWithIds.map((item) => ["option", item.id, item.text]),
        ...writeRelays
          .filter((r) => r.url.startsWith("wss://"))
          .slice(0, 10)
          .map((relay) => ["relay", relay.url]),
        ["polltype", multipleChoice ? "multiplechoice" : "singlechoice"],
        [
          "endsAt",
          String(
            Math.floor(Date.now() / 1000) + (parseInt(select.value || "") ?? 0)
          ),
        ],
      ],
    };
    if (lumiSetting.get().addClientTag) {
      eventParam.tags?.push(clientTag);
    }
    console.log("eventParam", eventParam);

    try {
      const signer = nip07Signer();
      const event = await signer.signEvent(eventParam);

      const res = await promisePublishSignedEvent(event);
      if (res.res.length > 0) {
        addToast({
          data: {
            title: "Published",
            description: "",
            color: "bg-green-500",
          },
        });

        const nostrId = nip19.neventEncode({
          id: res.event.id,
          relays: res.res.filter((re) => re.ok).map((re) => re.from),
          author: res.event.pubkey,
          kind: res.event.kind,
        });
        $dialogOpen = false;
        onPolled(nostrId);
      } else {
        addToast({
          data: {
            title: "Failed",
            description: "failed to vote",
            color: "bg-red-500",
          },
        });
      }
    } catch (error) {
      addToast({
        data: {
          title: "Failed",
          description: "failed to vote",
          color: "bg-red-500",
        },
      });
      console.error("投票の送信に失敗しました:", error);
    }
  }

  const handleClickOpenMap = () => {
    resetForm();
    $dialogOpen = true;
  };
</script>

<button aria-label="create poll" onclick={handleClickOpenMap} class="button">
  <ChartBar class=" stroke-magnum-300 " />
</button>

<Dialog bind:open={dialogOpen} zIndex={50} id="CreatePoll"
  >{#snippet main()}
    <div
      class="flex justify-between items-center mb-4 mx-auto flex-col w-[300px] max-w-[90vw]"
    >
      <label class=" flex flex-col gap-1 w-full my-6"
        >{$_("poll.title")}<input
          id="poll-title"
          class="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          bind:value={title}
          placeholder={$_("poll.title")}
        /></label
      >

      <div class="w-full">
        {$_("poll.select.title")}
        <div class="my-1 w-full max-h-40 overflow-auto space-y-2">
          {#each pollOptions as option, index}
            <div class="flex items-center space-x-2">
              <input
                id={`poll-option-${index}`}
                type="text"
                placeholder={`${$_("poll.select.title")} ${index + 1}`}
                class="flex-1 border rounded-md px-3 py-2 m-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                bind:value={pollOptions[index]}
              />
              {#if pollOptions.length > 2}
                <button
                  type="button"
                  aria-label="remove"
                  onclick={() => removeOption(index)}
                  class="text-red-500 hover:text-red-700"
                >
                  <X />
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      {#if pollOptions.length < maxOption}
        <button
          onclick={addOption}
          class="mt-3 text-blue-500 hover:text-blue-700 flex items-center"
        >
          <Plus />
          {$_("poll.select.add")}
        </button>
      {/if}

      <div class=" flex flex-col gap-1 w-full mt-6">
        <div class="text-sm font-medium">{$_("poll.limit")}</div>
        <button
          {...select.trigger}
          class="flex items-center justify-between overflow-hidden rounded-xl border border-gray-500 bg-gray-100 py-2 pl-3 pr-4 text-left text-gray-800
				transition hover:cursor-pointer hover:bg-gray-200
				active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50
				dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50"
        >
          {expirationOptions.find((opt) => opt.value === select.value)?.label ??
            "Select"}
        </button>

        <div
          {...select.content}
          class="flex flex-col rounded-xl border border-gray-500 bg-gray-100 p-2 shadow dark:bg-gray-800"
        >
          {#each expirationOptions as { value, label }}
            <div
              {...select.getOption(value)}
              class={[
                "relative flex items-center justify-between rounded-xl py-2 pl-8 pr-2",
                select.highlighted === value && "bg-gray-700",
                select.value === value && "font-semibold",
              ]}
            >
              <span>{label}</span>
              {#if select.isSelected(value)}
                <Check class="text-accent-300 font-bold" />
              {/if}
            </div>
          {/each}
        </div>

        <label
          for="multiple-choice"
          class="flex items-center mt-2 text-sm text-neutral-200 gap-1 flex-wrap"
        >
          <input
            type="checkbox"
            id="multiple-choice"
            bind:checked={multipleChoice}
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />

          {$_("poll.select.multi")}
        </label>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onclick={submitPoll}
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {$_("poll.publish")}
          </button>
        </div>
      </div>
    </div>
  {/snippet}</Dialog
>

<style lang="postcss">
  .button {
    @apply inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-magnum-500
    bg-zinc-900 font-medium leading-none text-zinc-200 hover:opacity-75 active:opacity-50;
  }

  [data-melt-select-content] {
    margin: 0 !important;
    position: absolute;
    pointer-events: none;
    opacity: 0;

    transform: scale(0.975);

    transition: 0.2s;
    transition-property: opacity, transform;
    transform-origin: var(--melt-popover-content-transform-origin, center);
  }

  [data-melt-select-content][data-open] {
    width: fit-content;
    pointer-events: auto;
    opacity: 1;
    color: currentColor;
    transform: scale(1);
  }
</style>
