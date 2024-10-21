<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import NoteTemplate from "./NoteTemplate.svelte";

  import { _ } from "svelte-i18n";
  import { loginUser } from "$lib/stores/stores";

  import Content from "./Content.svelte";
  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";
  import PopupUserName from "$lib/components/Elements/PopupUserName.svelte";

  import UserName from "./UserName.svelte";
  import Reply from "./Reply.svelte";

  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined;
  export let displayMenu: boolean;
  export let depth: number;
  export let maxHeight: string;
  export let tieKey: string | undefined;
  export let mini: boolean;
  export let warning: string[] | undefined;
  export let replyUsers: string[];
  export let thread: boolean;

  export let replyTag: string[] | undefined;
  let decrypt: string | undefined = undefined;

  //自分宛て？もしくは自分が書いた？
  $: forme =
    note.pubkey === $loginUser ||
    note.tags.find(
      (tag) => tag[0] === "p" && tag.length > 1 && tag[1] === $loginUser
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
      class="my-1 text-sm text-magnum-100 flex break-all flex-wrap overflow-x-hidden gap-x-1 max-h-24 overflow-y-auto"
    >
      {#each replyUsers as user}
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
    <div
      class="mt-0.5 overflow-y-auto overflow-x-hidden"
      style="max-height:{maxHeight ?? 'none'}"
    >
      <div class="text-sm text-neutral-400">{$_("event.kind4.text")}</div>
      {#if forme}
        {#if !decrypt}
          <button
            class="rounded bg-magnum-700 hover:opacity-75 active:opacity-50 text-magnum-50"
            on:click={decryptMessage}>{$_("event.kind4.decrypt")}</button
          >{:else}
          <!--複合できたら内容を表示-->
          <Content
            text={decrypt}
            tags={note.tags}
            {displayMenu}
            {depth}
            repostable={false}
            {tieKey}
          />
        {/if}
      {/if}
    </div>
    {#if warning}
      <!-- <WarningHide1 text={tag[1]} /> -->
      <WarningHide2 text={warning[1]} />
    {/if}
  </div>
</NoteTemplate>
