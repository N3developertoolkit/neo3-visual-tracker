type InvokeFileViewRequest = {
  addStep?: boolean;
  deleteStep?: { i: number };
  disconnect?: boolean;
  dismissError?: boolean;
  initiateConnection?: boolean;
  moveStep?: { from: number; to: number };
  runAll?: boolean;
  update?: {
    i: number;
    contract?: string;
    operation?: string;
    args?: (string | number)[];
  };
};

export default InvokeFileViewRequest;
