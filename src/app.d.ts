// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import "vite-plugin-pwa/pwa-assets";
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
  namespace svelte.JSX {
    interface HTMLAttributes<T> {
      // カスタムイベントを追加
      onenterViewport?: (event: CustomEvent) => void;
      onexitViewport?: (event: CustomEvent) => void;
    }
  }
}

export {};
