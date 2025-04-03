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
    interface PageState {
      dialogOpen?: {
        id: string;
        mediaView?: {
          imageUrls: string[];
          originalIndices: number[];
          currentIndex: number;
        };
      };
    }
  }
  /// <reference types="svelte" />
}

export {};
