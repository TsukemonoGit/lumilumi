<script lang="ts">
  import type { DefaultRelayConfig } from "rx-nostr";
  import { onMount } from "svelte";
  import { get, writable } from "svelte/store";
  import { createLabel, createRadioGroup, melt } from "@melt-ui/svelte";
  import type { ChangeFn } from "@melt-ui/svelte/internal/helpers";
  import { relayRegex } from "$lib/func/nostr";
  import { createToaster } from "@melt-ui/svelte";
  import { flip } from "svelte/animate";
  import { fly } from "svelte/transition";
  import X from "lucide-svelte/icons/x";

  const relays = writable<DefaultRelayConfig[]>([]);
  const useConfiguredRelays = writable<boolean>(true);
  const STORAGE_KEY = "relaySettings";
  const radioGroupSelected = writable("0");
  let relayInput: string = "";

  // ラジオボタン設定
  const {
    elements: {
      root: radioGrouproot,
      item: radioGroupitem,
      hiddenInput: radioGrouphiddenInput,
    },
    helpers: { isChecked: radioGroupisChecked },
  } = createRadioGroup({
    defaultValue: "0",
    value: radioGroupSelected,
    onValueChange: radioGroupValueChange,
  });

  const optionsArr = ["0", "1"];
  const optionsArrStr = [
    "kind10002(もしくはkind3)をつかう",
    "設定したリレーを使う",
  ];
  //inputurl
  const {
    elements: { root: relayInputroot },
  } = createLabel();
  // Toast設定
  type ToastData = {
    title: string;
    description: string;
    color: string;
  };

  const {
    elements: { content, title, description, close },
    helpers: { addToast },
    states: { toasts },
    actions: { portal },
  } = createToaster<ToastData>();

  // ローカルストレージから設定を読み込む
  onMount(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const { relays: savedRelays, useRelaySet: savedRelaySet } =
        JSON.parse(savedSettings);
      relays.set(savedRelays);
      radioGroupSelected.set(savedRelaySet);
    } else {
      radioGroupSelected.set("0");
    }
  });

  function addRelay() {
    if (!relayInput) return;
    const input = relayInput.trim();
    if (relayRegex.test(input)) {
      relays.update((current) => [
        ...current,
        { url: input, read: true, write: true },
      ]);
      relayInput = "";
    }
  }

  function removeRelay(index: number) {
    relays.update((current) => current.filter((_, i) => i !== index));
  }

  function saveSettings() {
    if (get(radioGroupSelected) === "1") {
      const currentRelays = get(relays);
      const hasRead = currentRelays.some((relay) => relay.read);
      const hasWrite = currentRelays.some((relay) => relay.write);
      if (!hasRead || !hasWrite) {
        addToast({
          data: {
            title: "Error",
            description:
              "リレーのリストには少なくとも1つの読み取りと書き込み可能なリレーが含まれている必要があります。",
            color: "bg-red-500",
          },
        });
        return;
      }
    }

    const settings = {
      relays: get(relays),
      useRelaySet: get(radioGroupSelected),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    addToast({
      data: {
        title: "Success",
        description: "設定が保存されました。",
        color: "bg-green-500",
      },
    });
  }

  function cancelSettings() {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const { relays: savedRelays, useRelaySet: savedRelaySet } =
        JSON.parse(savedSettings);
      relays.set(savedRelays);
      radioGroupSelected.set(savedRelaySet);
      addToast({
        data: {
          title: "Warning",
          description: "設定がリセットされました。",
          color: "bg-orange-500",
        },
      });
    }
  }

  function radioGroupValueChange(args: { curr: string; next: string }): string {
    return args.next;
  }
</script>

<!-- ラジオボタン -->
<div
  use:melt={$radioGrouproot}
  class="flex flex-col gap-3 data-[orientation=horizontal]:flex-row"
  aria-label="View density"
>
  {#each optionsArr as option}
    <div class="flex items-center gap-3">
      <button
        use:melt={$radioGroupitem(option)}
        class="grid h-6 w-6 cursor-default place-items-center rounded-full bg-white shadow-sm border border-magnum-500 hover:bg-magnum-100"
        id={option}
        aria-labelledby="{option}-label"
      >
        {#if $radioGroupisChecked(option)}
          <div class="h-3 w-3 rounded-full bg-magnum-500" />
        {/if}
      </button>
      <label
        class="font-medium capitalize leading-none text-magnum-900"
        for={option}
        id="{option}-label"
      >
        {optionsArrStr[Number(option)]}
      </label>
    </div>
  {/each}
  <input name="line-height" use:melt={$radioGrouphiddenInput} />
</div>

<!-- リレー設定 -->
<div>
  {#if $radioGroupSelected === "1"}
    <div>
      {#each $relays as relay, index}
        <div>
          <div>{relay.url}</div>
          <label>
            <input type="checkbox" bind:checked={relay.read} />
            read
          </label>
          <label>
            <input type="checkbox" bind:checked={relay.write} />
            write
          </label>
          <button on:click={() => removeRelay(index)}>✕</button>
        </div>
      {/each}
      <form>
        <div class="flex flex-col items-start justify-center">
          <label
            use:melt={$relayInputroot}
            for="relay"
            class="mb-0.5 font-medium text-magnum-900"
            data-melt-part="root"
          >
            <span>Relay URL</span>
          </label>
          <input
            type="text"
            id="relay"
            class="h-10 w-[240px] rounded-md bg-white px-3 py-2 text-magnum-700"
            placeholder="wss://"
            bind:value={relayInput}
          />
        </div>
      </form>
      <button
        class="ml-auto rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
        on:click={addRelay}>追加ボタン</button
      >
    </div>
  {/if}

  <button
    class="ml-auto rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
    on:click={saveSettings}>保存ボタン</button
  >
  <button
    class="ml-auto rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
    on:click={cancelSettings}>キャンセルボタン</button
  >
</div>

<!-- Toast表示 -->
<div
  class="fixed right-0 top-0 z-50 m-4 flex flex-col items-end gap-2 md:bottom-0 md:top-auto"
  use:portal
>
  {#each $toasts as { id, data } (id)}
    <div
      use:melt={$content(id)}
      animate:flip={{ duration: 500 }}
      in:fly={{ duration: 150, x: "100%" }}
      out:fly={{ duration: 150, x: "100%" }}
      class="rounded-lg bg-neutral-800 text-white shadow-md"
    >
      <div
        class="relative flex w-[24rem] max-w-[calc(100vw-2rem)] items-center justify-between gap-4 p-5"
      >
        <div>
          <h3
            use:melt={$title(id)}
            class="flex items-center gap-2 font-semibold"
          >
            {data.title}
            <span class="size-1.5 rounded-full {data.color}" />
          </h3>
          <div use:melt={$description(id)}>
            {data.description}
          </div>
        </div>
        <button
          use:melt={$close(id)}
          class="absolute right-4 top-4 grid size-6 place-items-center rounded-full text-magnum-500
          hover:bg-magnum-900/50"
        >
          <X class="size-4" />
        </button>
      </div>
    </div>
  {/each}
</div>
