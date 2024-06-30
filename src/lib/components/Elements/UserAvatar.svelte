<script lang="ts">
  import { splitHexColorString } from "$lib/func/util";
  import { createAvatar, melt } from "@melt-ui/svelte";
  import Avatar from "svelte-boring-avatars";
  export let url: string | undefined;
  export let name: string | undefined;
  export let pubkey: string;
  export let size: number = 40;
  export let square: boolean = false;
  const {
    elements: { image, fallback },
  } = createAvatar({
    src: url ?? "",
  });
</script>

<div
  class="flex items-center justify-center {!square
    ? 'rounded-full'
    : ''} bg-neutral-800 overflow-hidden"
  style="height: {size}px; width: {size}px;"
>
  <img
    use:melt={$image}
    alt="Avatar"
    class="object-cover {!square ? 'rounded-full' : ''}"
    style="height: 100%; width: 100%; object-fit: cover; object-position: center;"
  />
  <span
    use:melt={$fallback}
    class="text-sm font-medium text-magnum-100 h-full w-full flex items-center justify-center"
    ><Avatar
      {size}
      name={pubkey}
      variant="beam"
      colors={splitHexColorString(pubkey)}
      {square}
    /></span
  >
</div>
