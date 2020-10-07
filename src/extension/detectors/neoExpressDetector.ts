import BlockchainIdentifier from "../views/blockchainIdentifier";
import DetectorBase from "./detectorBase";

const SEARCH_PATTERN = "**/*.neo-express";

export default class NeoExpressDetector extends DetectorBase {
  private blockchainsSnapshot: BlockchainIdentifier[] = [];

  get blockchains(): BlockchainIdentifier[] {
    return [...this.blockchainsSnapshot];
  }

  constructor() {
    super(SEARCH_PATTERN);
  }

  async processFiles() {
    this.blockchainsSnapshot = this.files
      .map((_) => BlockchainIdentifier.fromNeoExpressConfig(_))
      .filter((_) => !!_) as BlockchainIdentifier[];
  }
}
