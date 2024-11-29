<script lang="ts">
  import { run } from 'svelte/legacy';

  import type Nostr from "nostr-typedef";

  import { userStatusStore } from "$lib/stores/stores";

  interface Props {
    pubkey: string;
    loading?: import('svelte').Snippet;
    children?: import('svelte').Snippet<[any]>;
  }

  let { pubkey, loading, children }: Props = $props();
  let data: Nostr.Event | undefined = $state();

  run(() => {
    if ($userStatusStore) {
      data = $userStatusStore.get(pubkey)?.get("music");
    }
  });

  // $: if ($slicedEvent) {
  //   const res: EventPacket | undefined = $queryClient.getQueryData([
  //     "userStatus",
  //     "music",
  //     pubkey,
  //   ]);
  //   if (res) {
  //     data = res;
  //     // console.log(data);
  //     createQuery({
  //       queryKey: ["userStatus", "music", pubkey],
  //       queryFn: () => res,
  //       //initialData: res,
  //       staleTime: Infinity,
  //       gcTime: Infinity,
  //     });
  //   }
  // }

  interface $$Slots {
    default: { event: Nostr.Event };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if !data}
  {@render loading?.()}
{:else if data}
  {@render children?.({ event: data, })}
{/if}
