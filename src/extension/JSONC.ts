export default class JSONC {
  static parse(input: string): any {
    // TODO: Switch to using https://github.com/Microsoft/node-jsonc-parser
    return JSON.parse(input);
  }

  static stringify(input: any) {
    // Stringify with whitespace (2 spaces per indentation):
    return JSON.stringify(input, undefined, 2);
  }
}
