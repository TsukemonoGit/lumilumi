<script lang="ts">
  import NaddrEvent from "$lib/components/NostrElements/kindEvents/NaddrEvent.svelte";
  import Note from "$lib/components/NostrElements/kindEvents/Note.svelte";
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import { hexRegex, nip33Regex } from "$lib/func/regex";
  import { formatToEventPacket, parseNaddr } from "$lib/func/util";
  import { loginUser } from "$lib/stores/globalRunes.svelte";
  import { Pin, RefreshCw } from "lucide-svelte";

  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import { nip19 } from "nostr-tools";
  import { nowProgress, queryClient, toastSettings } from "$lib/stores/stores";
  import type { QueryKey } from "@tanstack/svelte-query";
  import type { EventParameters } from "nostr-typedef";

  import { promisePublishEvent } from "$lib/func/nostr";
  import * as Nostr from "nostr-typedef";
  import { t } from "@konemono/svelte5-i18n";

  interface Props {
    userPubkey: string;
  }
  let { userPubkey }: Props = $props();
  let queryKey: QueryKey = $derived([
    "naddr",
    `10001:${userPubkey}:""`,
  ] as QueryKey);

  let editable = $derived(userPubkey === $loginUser);

  let inputValue = $state(
    "naddr1qvzqqqr4gupzpp9sc34tdxdvxh4jeg5xgu9ctcypmvsg0n00vwfjydkrjaqh0qh4qyxhwumn8ghj77tpvf6jumt9qyshwumn8ghj7cmpvakxjmmnw3ezucm0d4cxjmr994jhyun0wghxuet5qys8wumn8ghj7un9d3shjtt2wqhxummnw3ezuamfwfjkgmn9wshx5uqpz9mhxue69uhhstntda4xjunp9e5k7qgawaehxw309ahx7um5wghxxmmdwp5kcefdv4e8ymmj9ehx2aqpzamhxue69uhkummnw3ezu6t5w3skumt09ekk2mspz3mhxue69uhhyetvv9ujuerpd46hxtnfduq3vamnwvaz7tmjv4kxz7fwdehhxarj9e3xzmnyqyv8wumn8ghj7un9d3shjtnddakk7um5wgh8q6twdvqq5mt0dehj6ar0dak8xpj50v0"
  );
  let previewData = $state<{
    type: "note" | "naddr" | null;
    id: string | nip19.AddressPointer;
    isValid: boolean;
  }>({ type: null, id: "", isValid: false });
  let currentEvent = $state<Nostr.Event | null>(null);
  let deletingTag = $state<string[] | null>(null);
  let dialogMode = $state<"add" | "delete">("add");

  // 入力値の検証とプレビューデータ更新
  $effect(() => {
    if (!inputValue.trim()) {
      previewData = { type: null, id: "", isValid: false };
      return;
    }

    const trimmed = inputValue.trim();

    // hex形式のeventID
    if (hexRegex.test(trimmed)) {
      previewData = { type: "note", id: trimmed, isValid: true };
    }
    // note形式
    else if (trimmed.startsWith("note1")) {
      try {
        previewData = {
          type: "note",
          id: (nip19.decode(trimmed) as nip19.DecodedNote).data,
          isValid: true,
        };
      } catch {
        previewData = { type: null, id: trimmed, isValid: false };
      }
    }
    // nevent形式
    else if (trimmed.startsWith("nevent1")) {
      try {
        previewData = {
          type: "note",
          id: (nip19.decode(trimmed) as nip19.DecodedNevent).data.id,
          isValid: true,
        };
      } catch {
        previewData = { type: null, id: trimmed, isValid: false };
      }
    } else if (trimmed.startsWith("naddr")) {
      previewData = {
        type: "naddr",
        id: (nip19.decode(trimmed) as nip19.DecodedNaddr).data,
        isValid: true,
      };
    } else if (nip33Regex.test(trimmed)) {
      previewData = {
        type: "naddr",
        id: parseNaddr(["a", trimmed]),
        isValid: true,
      };
    } else {
      previewData = { type: null, id: trimmed, isValid: false };
    }
  });
  // svelte-ignore non_reactive_update
  let dialogOpen: (bool: boolean) => void = () => {};
  const openDialog = () => {
    dialogMode = "add";
    inputValue = "";
    previewData = { type: null, id: "", isValid: false };
    dialogOpen(true);
  };

  const addPin = async () => {
    if (!previewData.isValid || !previewData.type || !currentEvent) return;
    // 新しいタグを作成
    const newTag: string[] =
      previewData.type === "note"
        ? ["e", previewData.id as string]
        : [
            "a",
            `${(previewData.id as nip19.AddressPointer).kind}:${(previewData.id as nip19.AddressPointer).pubkey}:${(previewData.id as nip19.AddressPointer).identifier || ""}`,
          ];

    try {
      // 重複チェック
      const isDuplicate = currentEvent.tags.some(
        (tag: string[]) => tag[0] === newTag[0] && tag[1] === newTag[1]
      );

      if (isDuplicate) {
        $toastSettings = {
          color: "bg-red-500",
          title: "Error",
          description: "このアイテムは既にPINされています",
        };

        return;
      }
      const newPin: EventParameters = {
        content: currentEvent.content || "",
        tags: $state.snapshot([...(currentEvent.tags || []), newTag]),
        kind: 10001,
      };

      $nowProgress = true;
      const { event, res } = await promisePublishEvent(newPin);
      const from = res.find((r) => r.ok);
      if (from) {
        queryClient.setQueryData(
          queryKey,
          formatToEventPacket(event, from.from)
        );
      }
      $toastSettings = {
        title: "Published",
        description: "",
        color: "bg-green-500",
      };

      $nowProgress = false;
      dialogOpen(false);
    } catch (error) {
      $toastSettings = {
        title: "Failed",
        description: "failed to publish",
        color: "bg-red-500",
      };
      $nowProgress = false;
      dialogOpen(false);
    }
  };
  const confirmDelete = (tag: string[]) => {
    dialogMode = "delete";
    deletingTag = tag;
    dialogOpen(true);
  };

  const executeDelete = async () => {
    if (!deletingTag || !editable || !currentEvent) return;

    const delTag = $state.snapshot(deletingTag);

    try {
      const existingTags = currentEvent.tags.filter(
        (t: string[]) => !(delTag && t[0] === delTag[0] && t[1] === delTag[1])
      );

      const newPin: EventParameters = {
        content: currentEvent.content || "",
        tags: $state.snapshot(existingTags),
        kind: 10001,
      };
      $nowProgress = true;
      const { event, res } = await promisePublishEvent(newPin);
      const from = res.find((r) => r.ok);
      if (from) {
        queryClient.setQueryData(
          queryKey,
          formatToEventPacket(event, from.from)
        );
      }
      $toastSettings = {
        title: "Published",
        description: "",
        color: "bg-green-500",
      };

      $nowProgress = false;
      dialogOpen(false);
    } catch (error) {
      $toastSettings = {
        title: "Failed",
        description: "failed to publish",
        color: "bg-red-500",
      };
      $nowProgress = false;
      dialogOpen(false);
    }
  };

  const onClickOK = () => {
    if (dialogMode === "add") {
      addPin();
    } else {
      executeDelete();
    }
  };

  const refreshData = () => {
    //pinの更新
    $nowProgress = true;

    queryClient.invalidateQueries({ queryKey: queryKey });
    setTimeout(() => {
      $nowProgress = false;
    }, 1000);
  };
</script>

{#if userPubkey === loginUser.get()}
  <div class="flex flex-row-reverse gap-2 mx-1 items-center">
    <button
      class="rounded-md p-1 m-1 border border-magnum-300 text-magnum-300 font-bold hover:bg-magnum-800/50"
      onclick={openDialog}
    >
      Add Pin
    </button>
    <button
      class="text-magnum-300 p-1 rounded-full hover:bg-magnum-800/50"
      onclick={refreshData}><RefreshCw size={20} /></button
    >
  </div>
{/if}
<LatestEvent
  onChange={(event) => (currentEvent = event)}
  {queryKey}
  filters={[
    {
      kinds: [10001],
      limit: 1,
      authors: [userPubkey],
    },
  ]}
>
  {#snippet success({ event })}
    {#each event.tags.filter((tag: string[]) => (tag[0] === "e" && hexRegex.test(tag[1])) || (tag[0] === "a" && nip33Regex.test(tag[1]))) as [e, id], index}
      <div>
        <button
          onclick={() => confirmDelete([e, id])}
          class={`-rotate-45 text-magnum-400 ${editable ? "hover:-rotate-90 hover:text-magnum-300" : ""}`}
        >
          <Pin /></button
        >{#if e === "e"}<Note
            {id}
            displayMenu={true}
            depth={1}
            repostable={true}
          />{:else}
          <NaddrEvent
            data={parseNaddr([e, id])}
            displayMenu={true}
            depth={1}
            repostable={true}
            content={id}
          />
        {/if}
      </div>
    {/each}
  {/snippet}
</LatestEvent>
<AlertDialog
  bind:openDialog={dialogOpen}
  title={$t(dialogMode === "add" ? "pin.addTitle" : "pin.deleteTitle")}
  okButtonName={dialogMode === "add" ? "ADD" : "DELETE"}
  closeOnOutsideClick={true}
  {onClickOK}
>
  {#snippet main()}
    <div class="space-y-4">
      {#if dialogMode === "add"}
        <!-- PIN追加モード -->

        <div>
          <label
            for="pin-input"
            class="block text-sm font-medium text-neutral-300 mb-2"
          >
            {$t("pin.label")}
          </label>
          <input
            id="pin-input"
            bind:value={inputValue}
            placeholder="hex ID、note1..., nevent1..."
            class="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:border-magnum-500 focus:ring-1 focus:ring-magnum-500 focus:outline-none"
          />
        </div>

        {#if inputValue.trim()}
          <div class="border-t border-neutral-700 pt-4">
            <h3 class="text-sm font-medium text-neutral-300 mb-2">Preview</h3>

            {#if previewData.isValid}
              <div
                class="bg-neutral-800 rounded-md p-1 h-fit overflow-y-auto max-h-[40vh]"
              >
                {#if previewData.type === "note"}
                  <Note
                    id={previewData.id as string}
                    displayMenu={false}
                    depth={4}
                    repostable={false}
                  />
                {:else if previewData.type === "naddr"}
                  <NaddrEvent
                    data={previewData.id as nip19.AddressPointer}
                    displayMenu={false}
                    depth={4}
                    repostable={false}
                    content={undefined}
                  />
                {/if}
              </div>
            {:else}
              <div
                class="bg-red-900/20 border border-red-500/30 rounded-md p-3"
              >
                <p class="text-red-400 text-sm">{$t("pin.invalid")}</p>
              </div>
            {/if}
          </div>
        {/if}
      {:else}
        <!-- PIN削除モード -->

        <p class="text-neutral-300">{$t("pin.delete")}</p>

        {#if deletingTag && currentEvent}
          <div
            class="bg-neutral-800 rounded-md p-1 h-fit overflow-y-auto max-h-[40vh]"
          >
            {#if deletingTag[0] === "e"}
              <Note
                id={deletingTag[1]}
                displayMenu={false}
                depth={4}
                repostable={false}
              />
            {:else}
              <NaddrEvent
                data={parseNaddr(deletingTag)}
                displayMenu={false}
                depth={4}
                repostable={false}
                content={deletingTag[1]}
              />
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  {/snippet}
</AlertDialog>
