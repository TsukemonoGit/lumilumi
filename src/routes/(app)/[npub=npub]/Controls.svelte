<script lang="ts">
  import { SkipBack, StepBack, StepForward } from "lucide-svelte";

  let { page = $bindable(), maxPage, isLoading, loadingProgress } = $props();
</script>

<div class="controls">
  <button
    class="btn"
    onclick={() => (page = 0)}
    disabled={isLoading || page === 0}
    aria-label="最初のページへ"
  >
    <SkipBack />
  </button>
  <button
    class="btn"
    onclick={() => (page = Math.max(0, page - 1))}
    disabled={isLoading || page === 0}
    aria-label="前のページへ"
  >
    <StepBack />
  </button>
  <button
    class="btn"
    onclick={() => (page = page + 1)}
    disabled={isLoading || (maxPage !== null && page >= maxPage)}
    aria-label="次のページへ"
  >
    <StepForward />
  </button>

  <div class="loading-indicator">
    {#if isLoading || loadingProgress}
      <span class="spinner" aria-hidden="true"></span>
      <!--  <span>{loadingProgress ?? ""}</span> -->
    {/if}
  </div>
</div>

<style>
  .controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    min-height: 48px;
    padding: 0.5rem 0;
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border: none;
    border-radius: 8px;
    background-color: #444;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background-color 0.2s;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .btn:hover:not(:disabled) {
    background-color: #555;
  }

  .btn:disabled {
    background-color: #888;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    width: 42px;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e0e0e0;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
