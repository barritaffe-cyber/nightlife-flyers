declare module 'html-to-image' {
  export type Options = {
    filter?: (node: HTMLElement) => boolean;
    [key: string]: any;
  };

  export function toCanvas(node: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
  export function toPng(node: HTMLElement, options?: Options): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
  export function toSvg(node: HTMLElement, options?: Options): Promise<string>;
  export function toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
  export function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>;
}
