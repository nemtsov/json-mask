declare function filter(obj: any, compiledMask: any): any;
declare function compile(text: string): any;

declare interface Mask {
  <T = any>(obj: T, mask: string): Partial<T>;
  filter: typeof filter;
  compile: typeof compile;
}

declare const mask: Mask;

export default mask;
