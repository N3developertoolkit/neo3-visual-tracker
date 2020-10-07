import DetectorBase from "./detectorBase";

const SEARCH_PATTERN = "**/neo-servers.json";

export default class ServerListDetector extends DetectorBase {

  // TODO: Return structured data instead
  get jsonFiles() {
    return this.files;
  }

  constructor() {
    super(SEARCH_PATTERN);
  }

  async onChange() {
    for (const file of this.files) {

    }
  }
}
