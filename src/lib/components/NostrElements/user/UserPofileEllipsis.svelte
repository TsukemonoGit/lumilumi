<script lang="ts">
  import { Ellipsis } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";

  import UserMenu from "./UserMenu.svelte";
  import type { Profile } from "$lib/types";
  import Popover from "$lib/components/Elements/Popover.svelte";
  import { MenuButtonClass } from "$lib/func/constants";

  interface Props {
    pubkey: string;
    metadata?: Nostr.Event;
    prof?: Profile;

    tab?: string | undefined;
    zIndex: number;
  }

  let { pubkey, metadata, prof, tab, zIndex }: Props = $props();
</script>

<Popover ariaLabel="user menu" showCloseButton={false} {zIndex}>
  <button type="button" class={`${MenuButtonClass}`} title="menu"
    ><Ellipsis /></button
  >

  {#snippet popoverContent()}
    <div
      class="menu flex flex-col flex-wrap divide-y divide-zinc-500 bg-neutral-800 border border-zinc-100 rounded-md w-64 max-w-full p-1"
    >
      <UserMenu {pubkey} {metadata} profile={prof} {tab} />
    </div>
  {/snippet}
</Popover>

<style lang="postcss">
  .menu {
    @apply z-40 flex max-h-[300px] min-w-[220px] flex-col shadow-lg;

    @apply ring-0 !important;
  }
</style>
