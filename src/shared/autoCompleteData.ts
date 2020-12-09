import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

import AddressNames from "./addressNames";
import ContractNames from "./contractNames";

type AutoCompleteData = {
  contractManifests: { [contractHash: string]: Partial<ContractManifestJson> };
  contractHashes: { [contractPathOrWellKnownName: string]: string };
  contractNames: ContractNames;
  contractPaths: { [contractHash: string]: string[] };
  wellKnownAddresses: { [addressName: string]: string };
  addressNames: AddressNames;
};

export default AutoCompleteData;
