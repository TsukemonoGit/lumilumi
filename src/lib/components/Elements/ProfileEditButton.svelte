<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { nowProgress } from "$lib/stores/stores";
  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  import { _ } from "svelte-i18n";
  export let metadata: Nostr.Event;

  const handleClickEdit = () => {
    console.log($page.params);
    console.log($page.url?.pathname);
    goto(`${nip19.npubEncode(metadata.pubkey)}/profile`);
  };
</script>

<button
  disabled={$nowProgress}
  class="rounded-full bg-white border border-magnum-700 p-2 break-keep disabled:opacity-25 font-medium leading-none text-magnum-700 shadow active:opacity-50 hover:opacity-75 opacity-100"
  on:click={handleClickEdit}
>
  {$_("user.profileEdit")}
</button>
