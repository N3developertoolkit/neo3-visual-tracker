type InvokeFileViewRequest = {
  addStep?: boolean;
  close?: boolean;
  deleteStep?: { i: number };
  moveStep?: { from: number; to: number };
  runAll?: boolean;
  runStep?: { i: number };
  selectTransaction?: { txid: string | null };
  toggleTransactions?: boolean;
  toggleJsonMode?: boolean;
  update?: {
    i: number;
    contract?: string;
    operation?: string;
    args?: (string | number)[];
  };
  updateJson?: string;
};

export default InvokeFileViewRequest;
