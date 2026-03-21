<script lang="ts">
  import IconButton from "$lib/components/Elements/IconButton.svelte";
  import UserPicker from "$lib/components/UserPicker.svelte";
  import ListUserIcon from "$lib/components/NostrElements/ListUserIcon.svelte";

  import { Plus, UserPlus, UserCheck, UserLock } from "lucide-svelte";
  import { nip19 } from "nostr-tools";
  import { writable } from "svelte/store";
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import UserName from "$lib/components/NostrElements/user/UserName.svelte";

  interface Props {
    onAddUser: (type: "pub" | "prv", pubkey: string) => void;
  }
  let { onAddUser }: Props = $props();

  const dialogOpen = writable(false);

  let input = $state("");
  let pendingPubhex = $state<string | null>(null);
  let inputError = $state<string | null>(null);

  // npub or pubhex → pubhex
  function resolvePubhex(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    // hex pubkey (64文字)
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return trimmed.toLowerCase();
    }

    // npub1...
    try {
      const decoded = nip19.decode(trimmed);
      if (decoded.type === "npub") {
        return decoded.data as string;
      }
    } catch {
      // ignore
    }

    // nprofile
    try {
      const decoded = nip19.decode(trimmed);
      if (decoded.type === "nprofile") {
        return (decoded.data as { pubkey: string }).pubkey;
      }
    } catch {
      // ignore
    }

    return null;
  }

  $effect(() => {
    const resolved = resolvePubhex(input);
    if (input.trim() === "") {
      pendingPubhex = null;
      inputError = null;
    } else if (resolved) {
      pendingPubhex = resolved;
      inputError = null;
    } else {
      pendingPubhex = null;
      inputError = "無効な形式（npub / pubhex）";
    }
  });

  function handleAdd(type: "pub" | "prv") {
    if (!pendingPubhex) return;
    onAddUser(type, pendingPubhex);
    input = "";
    pendingPubhex = null;
    $dialogOpen = false;
  }

  function handlePickerSelect(pubhex: string) {
    if (!pubhex) return;
    // pickerからの選択はpubhexって名前のくせにnpubが返ってくるらしい
    console.log(pubhex);
    input = pubhex;
    try {
      pendingPubhex = nip19.decode(pubhex).data as string;
    } catch (err) {
      console.log(err);
    }
  }
</script>

<IconButton
  variant={"fill"}
  title={"リストにユーザーを追加"}
  onclick={() => ($dialogOpen = true)}
>
  <Plus />
</IconButton>

<Dialog
  id="list-member-adder"
  dialogTitle="ユーザーをリストに追加"
  open={dialogOpen}
>
  {#snippet main()}
    <div class="flex flex-col gap-4 pt-2">
      <!-- UserPicker -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-magnum-300">フォロー中から選択</span>
        <UserPicker onClickUser={handlePickerSelect} />
      </div>

      <!-- npub / pubhex 直接入力 -->
      <div class="flex flex-col gap-1">
        <label for="lma-npub" class="text-sm text-magnum-300">
          npub / pubhex を入力
        </label>
        <input
          id="lma-npub"
          type="text"
          class="h-8 w-full rounded-md text-magnum-100 border-2 border-magnum-400 bg-transparent px-2 text-sm"
          placeholder="npub1... または 64文字hex"
          bind:value={input}
        />
        {#if inputError}
          <p class="text-xs text-red-400">{inputError}</p>
        {/if}
      </div>

      <!-- プレビュー -->
      {#if pendingPubhex}
        <div
          class="flex items-center gap-2 rounded-md border border-magnum-600 p-2"
        >
          <ListUserIcon deleteMode={false} pubkey={pendingPubhex} />
          <UserName pubhex={pendingPubhex} />
        </div>

        <!-- 追加ボタン2つ -->
        <div class="flex gap-3">
          <button
            class="flex items-center gap-1 rounded-md border border-magnum-500 px-3 py-1.5 text-sm text-magnum-100 hover:bg-magnum-700 active:opacity-70"
            onclick={() => handleAdd("pub")}
          >
            <UserCheck size="16" />
            公開リストに追加
          </button>
          <button
            class="flex items-center gap-1 rounded-md border border-magnum-500 px-3 py-1.5 text-sm text-magnum-100 hover:bg-magnum-700 active:opacity-70"
            onclick={() => handleAdd("prv")}
          >
            <UserLock size="16" />
            非公開リストに追加
          </button>
        </div>
      {/if}
    </div>
  {/snippet}
</Dialog>
