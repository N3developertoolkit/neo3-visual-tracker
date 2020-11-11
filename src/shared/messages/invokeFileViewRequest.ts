type InvokeFileViewRequest = {
  addStep?: boolean;
  deleteStep?: { i: number };
  dismissError?: boolean;
  moveStep?: { from: number; to: number };
  runAll?: boolean;
  runStep?: { i: number };
  update?: {
    i: number;
    contract?: string;
    operation?: string;
    args?: (string | number)[];
  };
};

export default InvokeFileViewRequest;
