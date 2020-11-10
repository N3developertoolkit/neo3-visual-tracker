import AutoCompleteData from "../autoCompleteData";
import RecentTransaction from "../recentTransaction";

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
  recentTransactions: RecentTransaction[];
};

export default InvokeFileViewState;
