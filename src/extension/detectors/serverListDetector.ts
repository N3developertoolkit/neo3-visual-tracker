import * as fs from "fs";
import * as neonCore from "@cityofzion/neon-core";

import BlockchainIdentifier from "../views/blockchainIdentifier";
import DetectorBase from "./detectorBase";

const LOG_PREFIX = "[ServerListDetector]";

const SEARCH_PATTERN = "**/neo-servers.json";

const UNKNOWN_BLOCKCHAIN =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// These are the genesis block hashes of some well-known blockchains.
// We identify which blockchain an RPC URL corresponds to by requesting
// block 0 and then comparing the hash to the list below (and any other
// names the user has supplied through neo-servers.json file(s) in the
// current workspace):
const WELL_KNOWN_BLOCKCHAINS: { [genesisHash: string]: string } = {
  "0xd42561e3d30e15be6400b6df2f328e02d2bf6354c41dce433bc57687c82144bf":
    "Neo 2 MainNet",
  "0xb3181718ef6167105b70920e4a8fbbd0a0a56aacf460d70e10ba6fa1668f1fef":
    "Neo 2 TestNet",
  "0xc359030132be10fd19cfd0a27e289fe04acb0c5c4ca5254af8a2d99498c7da45":
    "Neo 3 TestNet",
};

// These are the RPC URLs made available to users who do not have their
// own neo-servers.json file(s) in their workspace:
const SEED_URLS: { [url: string]: boolean } = {
  // V2 MainNet:
  "https://m1.neo.nash.io": true,
  "https://m2.neo.nash.io": true,
  "http://seed1.ngd.network:10332": true,
  "http://seed2.ngd.network:10332": true,
  // V2 TestNet:
  "http://seed5.ngd.network:20332": true,
  // V3 TestNet:
  "http://seed1t.neo.org:20332": true,
};

export default class ServerListDetector extends DetectorBase {
  private blockchainsSnapshot: BlockchainIdentifier[] = [];

  get blockchains(): BlockchainIdentifier[] {
    return [...this.blockchainsSnapshot];
  }

  constructor(private readonly extensionPath: string) {
    super(SEARCH_PATTERN);
  }

  async processFiles() {
    const blockchainNames = { ...WELL_KNOWN_BLOCKCHAINS };
    const rpcUrls: { [url: string]: boolean } = { ...SEED_URLS };
    for (const file of this.files) {
      try {
        const contents = JSON.parse(fs.readFileSync(file).toString());
        const blockchainNamesThisFile = contents["neo-blockchain-names"];
        if (blockchainNamesThisFile) {
          for (let gensisBlockHash of Object.getOwnPropertyNames(
            blockchainNamesThisFile
          )) {
            gensisBlockHash = gensisBlockHash.toLowerCase().trim();
            const name = blockchainNamesThisFile[gensisBlockHash]?.trim();
            if (!blockchainNames[gensisBlockHash] && name) {
              blockchainNames[gensisBlockHash] = name;
            }
          }
        }
        const rpcUrlsThisFile = contents["neo-rpc-uris"];
        if (rpcUrlsThisFile && Array.isArray(rpcUrlsThisFile)) {
          for (const url of rpcUrlsThisFile) {
            rpcUrls[url] = true;
          }
        }
      } catch (e) {
        console.log(
          LOG_PREFIX,
          "Error parsing Neo Express config",
          file,
          e.message
        );
      }
    }
    const uniqueUrls = Object.getOwnPropertyNames(rpcUrls);
    const genesisBlockHashes = await Promise.all(
      uniqueUrls.map((_) => this.tryGetGenesisBlockHash(_))
    );
    const urlsByBlockchain: { [genesisHash: string]: string[] } = {};
    for (let i = 0; i < uniqueUrls.length; i++) {
      urlsByBlockchain[genesisBlockHashes[i]] =
        urlsByBlockchain[genesisBlockHashes[i]] || [];
      urlsByBlockchain[genesisBlockHashes[i]].push(uniqueUrls[i]);
    }
    const newBlockchainsSnapshot: BlockchainIdentifier[] = [];
    for (const genesisHash of Object.getOwnPropertyNames(urlsByBlockchain)) {
      const name = blockchainNames[genesisHash] || "Unknown Blockchain";
      const urls = urlsByBlockchain[genesisHash];
      const isWellKnown = !!WELL_KNOWN_BLOCKCHAINS[genesisHash];
      newBlockchainsSnapshot.push(
        BlockchainIdentifier.fromNameAndUrls(this.extensionPath, name, urls, isWellKnown)
      );
    }
    this.blockchainsSnapshot = newBlockchainsSnapshot;
  }

  private async tryGetGenesisBlockHash(rpcUrl: string) {
    try {
      const rpcClient = new neonCore.rpc.RPCClient(rpcUrl);
      const genesisBlock = await rpcClient.getBlock(0, true);
      return genesisBlock.hash;
    } catch (e) {
      console.log(
        LOG_PREFIX,
        "Could not get genesis blockhash from",
        rpcUrl,
        e.message
      );
      return UNKNOWN_BLOCKCHAIN;
    }
  }
}
