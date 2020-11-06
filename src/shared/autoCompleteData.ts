import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

type AutoCompleteData = {
  contractMetadata: { [hashOrNefFile: string]: ContractManifestJson };
  addressSuggestions: string[];
};

export default AutoCompleteData;
