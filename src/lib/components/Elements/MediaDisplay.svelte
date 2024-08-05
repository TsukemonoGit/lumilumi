<!-- src/lib/components/Modal.svelte -->
<script lang="ts">
  import { ChevronLeft, ChevronRight, X } from "lucide-svelte";

  export let images: string[] = [];
  export let currentIndex: number = 0;
  export let onClose: () => void = () => {};

  const goToNext = () => {
    currentIndex = (currentIndex + 1) % images.length;
  };

  const goToPrev = () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
  };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="modal" on:click={onClose}>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-content" on:click|stopPropagation>
    <!-- svelte-ignore a11y-missing-attribute -->
    <img src={images[currentIndex]} class="modal-image" />
  </div>
  {#if images.length > 1}
    <button class="prev" on:click|stopPropagation={goToPrev}
      ><ChevronLeft /></button
    >
    <button class="next" on:click|stopPropagation={goToNext}
      ><ChevronRight /></button
    >{/if}
  <button class="close" on:click|stopPropagation={onClose}><X /></button>
</div>

<style>
  .modal {
    z-index: 50;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .modal-content {
    position: relative;
    max-width: 100vw;
    max-height: 100vh;
  }
  .modal-image {
    max-width: 100vw;
    max-height: 100vh;
    object-fit: contain;
  }
  .prev,
  .next,
  .close {
    position: absolute;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    cursor: pointer;
    padding: 0.5em;
    border-radius: 100%;
  }
  .prev {
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  .next {
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  .close {
    top: 10px;
    right: 10px;
  }
</style>
