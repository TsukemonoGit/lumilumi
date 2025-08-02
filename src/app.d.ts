// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import "vite-plugin-pwa/pwa-assets";

declare global {
  interface Window {
    __ERUDA_LOADED__?: boolean;
  }

  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}

    interface PageState {
      dialogOpen?: {
        id: string;
        mediaView?: {
          imageUrls: string[];
          originalIndices: number[];
          currentIndex: number;
        };
      };
      viewIndex?: number;
    }
  }
  /// <reference types="svelte" />
}

// SvelteKitのNavigationTargetを拡張
declare module "$app/navigation" {
  interface NavigationTarget {
    state?: App.PageState;
  }
}

export {};
