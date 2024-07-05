<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { nowProgress } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";
  import { _ } from "svelte-i18n";
  export let metadata: Nostr.Event;

  const handleClickEdit = () => {
    console.log($page.params);
    console.log($page.url?.pathname);
    goto(`${$page.url?.pathname}/profile`);
  };
</script>

<button
  disabled={$nowProgress}
  class="rounded-full bg-white border border-magnum-700 p-2 break-keep disabled:opacity-25 font-medium leading-none text-magnum-700 shadow hover:opacity-60 opacity-100"
  on:click={handleClickEdit}
>
  {$_("user.profileEdit")}
</button>
