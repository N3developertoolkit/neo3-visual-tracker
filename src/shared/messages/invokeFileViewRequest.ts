type InvokeFileViewRequest = {
  addStep?: boolean;
  deleteStep?: { i: number };
  dismissError?: boolean;
  moveStep?: { from: number; to: number };
  runAll?: boolean;
  runStep?: { i: number };
  toggleTransactions?: boolean;
  update?: {
    i: number;
    contract?: string;
    operation?: string;
    args?: (string | number)[];
  };
  selectTransaction?: { txid: string | null };
};

export default InvokeFileViewRequest;
