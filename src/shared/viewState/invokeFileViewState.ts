import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

type InvokeFileViewState = {
  view: "invokeFile";
  panelTitle: string;
  fileContents: {
    contract?: string;
    operation?: string;
    args?: (string | number)[];
  }[];
  baseHref: string;
  contracts: { [hashOrNefFile: string]: ContractManifestJson };
  nefHints: { [hash: string]: { [nefPath: string]: boolean } };
  errorText: string;
  connectedTo: string;
  connectionState: "ok" | "connecting" | "none";
};

export default InvokeFileViewState;
