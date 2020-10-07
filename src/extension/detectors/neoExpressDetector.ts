import DetectorBase from "./detectorBase";

const SEARCH_PATTERN = "**/*.neo-express";

export default class NeoExpressDetector extends DetectorBase {

  // TODO: Return structured data instead
  get neoExpressFiles() {
    return this.files;
  }

  constructor() {
    super(SEARCH_PATTERN);
  }

  async processFiles() {
    for (const file of this.files) {
      // TODO: ...
    }
  }
}
