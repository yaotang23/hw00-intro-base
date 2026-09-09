import 'dat.gui';

// dat.GUI exports this parser, but @types/dat.gui omits its color namespace.
declare module 'dat.gui' {
  export namespace color {
    class Color {
      constructor(value: unknown);
      readonly r: number;
      readonly g: number;
      readonly b: number;
    }
  }
}
