import AutoCompleteData from "../autocompleteData";

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
};

export default InvokeFileViewState;
