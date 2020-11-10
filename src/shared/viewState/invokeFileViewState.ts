import { TransactionJson } from "@cityofzion/neon-core/lib/tx";

import AutoCompleteData from "../autoCompleteData";

type InvokeFileViewState = {
  view: "invokeFile";
  panelTitle: string;
  fileContents: {
    contract?: string;
    operation?: string;
    args?: (string | number)[];
  }[];
  autoCompleteData: AutoCompleteData;
  errorText: string;
  connectedTo: string;
  connectionState: "ok" | "connecting" | "none";
  recentTransactions: { txid: string; tx?: TransactionJson }[];
};

export default InvokeFileViewState;
