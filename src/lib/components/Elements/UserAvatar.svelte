<script lang="ts">
  import { createAvatar, melt } from "@melt-ui/svelte";
  export let url: string | undefined;
  export let name: string | undefined;

  export let size: number = 40;
  const {
    elements: { image, fallback },
  } = createAvatar({
    src: url ?? "",
  });
</script>

<div
  class="flex items-center justify-center rounded-full bg-neutral-800 overflow-hidden"
  style="height: {size}px; width: {size}px;"
>
  <img
    use:melt={$image}
    alt="Avatar"
    class="object-cover rounded-full"
    style="height: 100%; width: 100%; object-fit: cover; object-position: center;"
  />
  <span
    use:melt={$fallback}
    class="text-sm font-medium text-magnum-100 h-full w-full flex items-center justify-center"
    >{name}
  </span>
</div>
