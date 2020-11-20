import * as jsoncParser from "jsonc-parser";

export default class JSONC {
  static parse(input: string): any {
    const errors: jsoncParser.ParseError[] = [];
    const result = jsoncParser.parse(input, errors, {
      allowEmptyContent: true,
      allowTrailingComma: true,
      disallowComments: false,
    });
    if (errors.length) {
      const elipsis = errors.length > 3;
      errors.length = Math.min(errors.length, 3);
      throw new Error(
        `JSON parse error${errors.length > 1 ? "s" : ""} (${errors
          .map(
            (_) => `${jsoncParser.printParseErrorCode(_.error)} at ${_.offset}`
          )
          .join(", ")}${elipsis ? ", ..." : ""})`
      );
    }
    return result;
  }

  static stringify(input: any) {
    // Stringify with whitespace (2 spaces per indentation):
    return JSON.stringify(input, undefined, 2);
  }
}
