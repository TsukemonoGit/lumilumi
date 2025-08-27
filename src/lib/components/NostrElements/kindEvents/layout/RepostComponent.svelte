<script lang="ts">
  const { kindIcon, userIcon, name, actionButtons } = $props();
</script>

<div class="flex gap-1 items-center bg-magnum-800/25">
  {@render kindIcon?.()}

  <div class="self-center">
    {@render userIcon?.()}
  </div>

  {@render name?.()}

  <div class="ml-auto">
    {@render actionButtons?.()}
  </div>
</div>
