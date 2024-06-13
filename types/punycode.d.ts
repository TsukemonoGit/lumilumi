// types/punycode.d.ts
declare module "punycode" {
  export function decode(input: string): string;
  export function encode(input: string): string;
  export function toASCII(input: string): string;
  export function toUnicode(input: string): string;
  namespace ucs2 {
    export function decode(string: string): number[];
    export function encode(array: number[]): string;
  }
}
