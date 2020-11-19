export default class JSONC {
  static parse(input: string): any {
    // TODO: Switch to using https://github.com/Microsoft/node-jsonc-parser
    return JSON.parse(input);
  }
}
