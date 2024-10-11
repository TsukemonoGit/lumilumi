<script lang="ts">
  import { Ellipsis } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";

  import UserMenu from "./UserMenu.svelte";
  import type { Profile } from "$lib/types";
  import Popover from "./Popover.svelte";
  export let metadata: Nostr.Event;
  export let prof: Profile;
  export let tieKey: string | undefined;
</script>

<Popover ariaLabel="user menu" showCloseButton={false}>
  <button
    type="button"
    class="w-fit rounded-full bg-neutral-200 text-magnum-600 p-1 hover:opacity-75 active:opacity-50"
    ><Ellipsis /></button
  >

  <div
    slot="popoverContent"
    class="menu flex flex-col flex-wrap divide-y divide-zinc-500 bg-neutral-800 border border-zinc-100 rounded-md w-64 max-w-full p-1"
  >
    <UserMenu pubkey={metadata.pubkey} {metadata} profile={prof} {tieKey} />
  </div>
</Popover>

<style lang="postcss">
  .menu {
    @apply z-40 flex max-h-[300px] min-w-[220px] flex-col shadow-lg;

    @apply ring-0 !important;
  }
</style>
