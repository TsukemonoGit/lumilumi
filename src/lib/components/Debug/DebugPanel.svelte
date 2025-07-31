<script lang="ts">
  import {
    showDebug,
    debugLogs,
    storageData,
    toggleDebug,
    clearStorage,
    getStorageData,
    DEBUG_MODE,
  } from "./debug";
</script>

{#if DEBUG_MODE}
  <div style="position: fixed; top: 10px; right: 10px; z-index: 9999;">
    <button
      onclick={toggleDebug}
      style="background: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;"
    >
      {$showDebug ? "Hide Debug" : "Show Debug"}
    </button>
  </div>

  {#if $showDebug}
    <div
      style="
      position: fixed;
      top: 50px;
      right: 10px;
      width: 350px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 10px;
      border-radius: 8px;
      z-index: 9998;
      overflow-y: auto;
      font-family: monospace;
      font-size: 11px;
      word-wrap: break-word;
    "
    >
      <h3 style="margin-top: 0;">Debug Panel</h3>

      <button
        onclick={() => getStorageData()}
        style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; margin-right: 5px; cursor: pointer;"
      >
        Refresh
      </button>
      <button
        onclick={clearStorage}
        style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;"
      >
        Clear Storage
      </button>

      <h4 style="margin-top: 10px;">LocalStorage Contents:</h4>
      {#each Object.entries($storageData) as [key, value]}
        <div>
          <strong style="color: #17a2b8;">{key}:</strong>
          <pre
            style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; max-height: 100px; overflow-y: auto;   white-space: pre-wrap;
            word-break: break-word;
            overflow-wrap: break-word;">
{value === null ? "null" : JSON.stringify(value, null, 2)}
        </pre>
        </div>
      {/each}

      <h4 style="margin-top: 10px;">Debug Logs:</h4>
      <div
        style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; max-height: 300px; overflow-y: auto;"
      >
        {#each $debugLogs as log}
          <div
            style="margin-bottom: 2px; line-height: 1.3; word-break: break-word;"
          >
            {log}
          </div>
        {/each}
      </div>
    </div>
  {/if}
{/if}
