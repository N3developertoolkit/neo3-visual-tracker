import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

import AddressNames from "./addressNames";

type AutoCompleteData = {
  contractManifests: { [contractHash: string]: Partial<ContractManifestJson> };
  contractHashes: { [contractPathOrWellKnownName: string]: string };
  contractNames: { [contractHash: string]: string[] };
  contractWellKnownNames: { [contractHash: string]: string[] };
  contractPaths: { [contractHash: string]: string[] };
  wellKnownAddresses: { [addressName: string]: string };
  addressNames: AddressNames;
};

export default AutoCompleteData;
