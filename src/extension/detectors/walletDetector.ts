import DetectorBase from "./detectorBase";

const SEARCH_PATTERN = "**/*.json";

export default class WalletDetector extends DetectorBase {
  constructor() {
    super(SEARCH_PATTERN);
  }

  async processFiles() {}
}
