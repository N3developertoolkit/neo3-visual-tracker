import React from "react";

import RecentTransaction from "../../../shared/recentTransaction";

type Props = {
  transactions: RecentTransaction[];
};

export default function TransactionList({ transactions }: Props) {
  return (
    <div>
      <pre>{JSON.stringify(transactions, undefined, 2)}</pre>
    </div>
  );
}
