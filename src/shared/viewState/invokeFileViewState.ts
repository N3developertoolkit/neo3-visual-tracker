import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

type InvokeFileViewState = {
  view: "invokeFile";
  panelTitle: string;
  fileContents: {
    contract?: string;
    operation?: string;
    args?: (string | number)[];
  }[];
  contracts: { [hashOrNefFile: string]: ContractManifestJson };
  nefHints: { [hash: string]: { [nefPath: string]: boolean } };
  addressSuggestions: string[];
  errorText: string;
  connectedTo: string;
  connectionState: "ok" | "connecting" | "none";
};

export default InvokeFileViewState;
