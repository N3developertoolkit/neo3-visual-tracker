type InvokeFileViewState = {
  view: "invokeFile";
  panelTitle: string;
  fileContents: {
    contract?: string;
    operation?: string;
    args?: (string | number)[];
  }[];
  contracts: any[];
  errorText: string;
  connectedTo: string;
};

export default InvokeFileViewState;
