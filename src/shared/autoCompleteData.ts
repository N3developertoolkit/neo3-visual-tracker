import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

type AutoCompleteData = {
  contracts: { [hashOrNefFile: string]: ContractManifestJson };
  nefHints: { [hash: string]: { [nefPath: string]: boolean } };
  addressSuggestions: string[];
};

export default AutoCompleteData;
