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
    options: { src },
  } = createAvatar({
    src: url ?? "",
  });
  $: if (url) {
    src.set(url);
  }
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
    class="relative object-cover {!square ? 'rounded-full' : ''}"
    style="height: 100%; width: 100%; object-fit: cover; object-position: center;"
  />
  <span use:melt={$fallback} class="absolute overflow-hidden"
    ><Avatar
      {size}
      name={pubkey}
      variant="beam"
      colors={splitHexColorString(pubkey)}
      {square}
    /></span
  >
</div>
