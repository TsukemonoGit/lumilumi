<script lang="ts">
  import { goto } from "$app/navigation";
  import { nowProgress } from "$lib/stores/stores";
  import * as nip19 from "nostr-tools/nip19";
  import * as Nostr from "nostr-typedef";
  import { t as _ } from "@konemono/svelte5-i18n";
  interface Props {
    metadata: Nostr.Event;
  }

  const { metadata }: Props = $props();

  const handleClickEdit = () => {
    goto(`${nip19.npubEncode(metadata.pubkey)}/profile`);
  };
</script>

<button
  disabled={$nowProgress}
  class="rounded-full bg-white border border-magnum-700 p-2 break-keep disabled:opacity-25 font-medium leading-none text-magnum-700 shadow active:opacity-50 hover:opacity-75 opacity-100"
  onclick={handleClickEdit}
>
  {$_("user.profileEdit")}
</button>
