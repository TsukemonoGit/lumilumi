<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { getFollowingList } from "$lib/func/nostr";
  import { onlyFollowee } from "$lib/stores/stores";
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  //$: console.log($onlyFollowee);

  const handleChangeChecked = () => {
    console.log($onlyFollowee);
    localStorage.setItem("onlyFollowee", $onlyFollowee.toString());
  };
  let followee = getFollowingList();
  let isMounted = false;
  onMount(() => {
    if (!isMounted) {
      isMounted = true;
      init();
    }
  });
  afterNavigate(() => {
    if (!isMounted) {
      isMounted = true;
      init();
    }
  });
  function init() {
    followee = getFollowingList();
    isMounted = false;
  }
</script>

{#if followee && followee.length > 0}
  <label class="ml-auto my-2">
    <input
      type="checkbox"
      class="rounded-checkbox"
      bind:checked={$onlyFollowee}
      on:change={handleChangeChecked}
    />
    {$_("notifications.onlyFollowee")}
  </label>
{/if}
