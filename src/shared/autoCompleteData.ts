import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

type AutoCompleteData = {
  contractManifests: { [contractHash: string]: Partial<ContractManifestJson> };
  contractHashes: { [contractPath: string]: string };
  contractPaths: { [contractHash: string]: string[] };
  wellKnownAddresses: { [addressName: string]: string };
  addressNames: { [walletAddress: string]: string[] };
};

export default AutoCompleteData;
