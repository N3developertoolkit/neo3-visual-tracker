import DetectorBase from "./detectorBase";

const SEARCH_PATTERN = "**/*.nef";

export default class ContractDetector extends DetectorBase {
  get contracts() {
    return this.files;
  }

  constructor() {
    super(SEARCH_PATTERN);
  }
}
