<script lang="ts">
  import type { Token } from "markdown-it/index.js";

  interface Props {
    part: Token;
  }

  let { part }: Props = $props();

  // checked属性があるかどうかで判定
  const isChecked = part.attrs?.some(([key, value]) => key === "checked");
</script>

<input
  type="checkbox"
  checked={isChecked}
  disabled
  id={part.attrs?.find(([key]) => key === "id")?.[1] ?? ""}
/>

<style lang="postcss">
  input[type="checkbox"] {
    vertical-align: middle;
    width: 24px;
    height: 24px;

    border: 1px solid theme("colors.magnum.600");
    border-radius: 4px;
    background-color: transparent;

    appearance: none;
    -webkit-appearance: none;
    outline: none;
    cursor: not-allowed;
    position: relative;
  }

  /* チェックされている状態 */
  input[type="checkbox"]:checked {
    background-color: theme("colors.magnum.600") !important;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='3' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 8l3 3 5-5'/%3E%3C/svg%3E") !important;
    background-repeat: no-repeat !important;
    background-position: center !important;
  }

  /* 無効かつチェックされている状態 */
  input[type="checkbox"]:disabled:checked {
    cursor: not-allowed;
  }

  /* 無効だが未チェックの状態 */
  input[type="checkbox"]:disabled:not(:checked) {
    cursor: not-allowed;
  }
</style>
