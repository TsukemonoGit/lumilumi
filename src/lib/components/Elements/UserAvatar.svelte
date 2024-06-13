<script lang="ts">
  import { createAvatar, melt } from "@melt-ui/svelte";
  export let url: string | undefined;
  export let name: string | undefined;
  export let mini: boolean | undefined = false;
  const {
    elements: { image, fallback },
  } = createAvatar({
    src: url ?? "",
  });
</script>

<div
  class="flex {mini
    ? 'h-[24px] w-[24px]'
    : 'h-[40px] w-[40px]'} items-center justify-center rounded-full bg-neutral-800"
>
  <img
    use:melt={$image}
    alt="Avatar"
    class="h-full w-full object-cover rounded-[inherit]"
  />
  <span
    use:melt={$fallback}
    class="text-sm font-medium text-magnum-100 overflow-hidden h-full w-full"
    >{name}</span
  >
</div>
