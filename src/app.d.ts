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
  /// <reference types="svelte" />

  declare namespace svelte.JSX {
    interface HTMLAttributes<T> {
      onenterViewport?: (event: CustomEvent) => void;
    }
  }
}

export {};
