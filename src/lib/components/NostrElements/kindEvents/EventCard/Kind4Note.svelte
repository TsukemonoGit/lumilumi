<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { _ } from "svelte-i18n";
  import { loginUser } from "$lib/stores/stores";

  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";
  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";

  import Content from "../../content/Content.svelte";
  import NoteTemplate from "./NoteTemplate.svelte";
  import UserName from "../../user/UserName.svelte";
  import Reply from "../Reply.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: number | undefined;
    tieKey: string | undefined;
    mini: boolean;
    warning: string[] | undefined;
    replyUsers: string[];
    thread: boolean;
    replyTag: string[] | undefined;
  }

  let {
    note,
    metadata,
    displayMenu,
    depth,
    maxHeight,
    tieKey,
    mini,
    warning,
    replyUsers,
    thread,
    replyTag,
  }: Props = $props();

  let decrypt: string | undefined = $state(undefined);

  //自分宛て？もしくは自分が書いた？
  let forme = $derived(
    note.pubkey === $loginUser ||
      note.tags.find(
        (tag) => tag[0] === "p" && tag.length > 1 && tag[1] === $loginUser
      )
  );

  //どっちがどっち
  async function decryptMessage() {
    const user = note.tags.find(
      (tag) => tag[0] === "p" && tag.length > 1 && tag[1] !== $loginUser
    )?.[1];
    try {
      decrypt = await (window?.nostr as Nostr.Nip07.Nostr)?.nip04?.decrypt(
        user ?? note.pubkey,
        note.content
      );

      if (!decrypt) {
        decrypt = "decrypt error";
      }
    } catch (error) {
      decrypt = "decrypt error";
    }
  }
</script>

<NoteTemplate {note} {metadata} {mini} {displayMenu} {depth} {tieKey}>
  {#if replyUsers.length > 0}
    <div
      class="my-1 text-sm text-magnum-300 flex break-all flex-wrap overflow-x-hidden gap-x-1 max-h-12 overflow-y-auto"
    >
      <span class="text-sm text-neutral-50">To:</span>{#each replyUsers as user}
        {#if !displayMenu}<UserName pubhex={user} />{:else}
          <PopupUserName pubkey={user} {tieKey} />{/if}
      {/each}
    </div>
  {/if}
  {#if !thread && (replyTag || replyUsers.length > 0)}
    <Reply {replyTag} {displayMenu} {depth} repostable={false} {tieKey} />
    <!--<hr />-->
  {/if}

  <div class="relative overflow-hidden mb-1.5">
    <div class="text-sm text-neutral-400">{$_("event.kind4.text")}</div>
    {#if forme}
      {#if !decrypt}
        <button
          class="rounded bg-magnum-700 hover:opacity-75 active:opacity-50 text-magnum-50"
          onclick={decryptMessage}>{$_("event.kind4.decrypt")}</button
        >{:else}
        <!--複合できたら内容を表示-->
        <Content
          {maxHeight}
          text={decrypt}
          tags={note.tags}
          {displayMenu}
          {depth}
          repostable={false}
          {tieKey}
        />
      {/if}
    {/if}

    {#if warning}
      <!-- <WarningHide1 text={tag[1]} /> -->
      <WarningHide2 text={warning[1]} />
    {/if}
  </div>
</NoteTemplate>
