import DetectorBase from "./detectorBase";

const SEARCH_PATTERN = "**/*.nxp3-checkpoint";

export default class CheckpointDetector extends DetectorBase {
  get checkpointFiles() {
    return this.files;
  }

  constructor() {
    super(SEARCH_PATTERN);
  }
}
