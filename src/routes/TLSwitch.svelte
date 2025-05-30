<script lang="ts">
  import { House, Earth, UserRoundCheck } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";

  function openHome() {
    // 現在のパスが `/` ならトップにスクロール
    if (page.url?.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      goto("/");
    }
  }

  function openGlobal() {
    // 現在のパスが `/global` ならトップにスクロール
    if (page.url?.pathname === "/global") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      goto("/global");
    }
  }

  // 現在のパスを取得
  let currentPath = $derived(page.url?.pathname);
  let isHome = $derived(currentPath === "/");
  let isGlobal = $derived(currentPath === "/global");
</script>

<div class="fixed bottom-16 right-6 z-10 flex flex-col gap-4">
  <button
    class="p-1 rounded-full transition-all duration-200 {isHome
      ? 'bg-magnum-600 ring-2 ring-magnum-400 ring-offset-2 scale-110'
      : 'bg-magnum-600/70 hover:bg-magnum-600'}"
    title="Follow TL"
    onclick={openHome}
  >
    <UserRoundCheck class={isHome ? "text-white" : "text-white/80"} />
  </button>

  <button
    class="p-1 rounded-full transition-all duration-200 {isGlobal
      ? 'bg-magnum-600 ring-2 ring-magnum-400 ring-offset-2 scale-110'
      : 'bg-magnum-600/70 hover:bg-magnum-600'}"
    title="Global TL"
    onclick={openGlobal}
  >
    <Earth class={isGlobal ? "text-white" : "text-white/80"} />
  </button>
</div>
