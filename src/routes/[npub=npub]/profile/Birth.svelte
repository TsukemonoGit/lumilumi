<script lang="ts">
  let {
    birth_month = $bindable(),
    birth_day = $bindable(),
    birth_year = $bindable(),
  } = $props();
</script>

<div class="grid grid-cols-3 gap-2">
  <input
    type="number"
    min="1"
    max="31"
    class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500 mb-2"
    bind:value={birth_day}
    placeholder="day"
  />
  <input
    type="number"
    min="1"
    max="12"
    class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500 mb-2"
    bind:value={birth_month}
    placeholder="month"
  />

  <input
    type="number"
    class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500 mb-2"
    bind:value={birth_year}
    placeholder="year (option)"
  />
</div>
