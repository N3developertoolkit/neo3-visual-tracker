import { TransactionJson } from "@cityofzion/neon-core/lib/tx";

import TransactionStatus from "./transactionStatus";

type RecentTransaction = {
  blockchain: string;
  txid: string;
  state: TransactionStatus;
  tx?: TransactionJson;
};

export default RecentTransaction;
