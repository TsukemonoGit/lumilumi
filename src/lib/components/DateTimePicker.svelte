<script lang="ts">
  interface Props {
    value?: string;
    onChange?: (dateTimeString: string) => void;
    label?: string;
    required?: boolean;
  }

  let { value, onChange, label, required = false }: Props = $props();

  let dateTimeValue: string = $state(value || "");

  function handleSubmit() {
    if (dateTimeValue && onChange) {
      onChange(dateTimeValue);
    }
  }

  $effect(() => {
    if (value) {
      dateTimeValue = value;
    }
  });
</script>

<div class="flex flex-col gap-2 mr-2">
  {#if label}
    <span class="text-sm font-medium">{label}</span>
  {/if}
  <div class="grid grid-cols-[1fr_auto] gap-1">
    <input
      type="datetime-local"
      bind:value={dateTimeValue}
      {required}
      class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-magnum-500 focus:outline-none focus:ring-1 focus:ring-magnum-500"
    />
    <button
      type="button"
      onclick={handleSubmit}
      disabled={!dateTimeValue}
      class="rounded-lg bg-magnum-500 px-4 py-2 text-sm font-medium hover:bg-magnum-600 focus:outline-none focus:ring-2 text-magnum-900 focus:ring-magnum-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      OK
    </button>
  </div>
</div>
