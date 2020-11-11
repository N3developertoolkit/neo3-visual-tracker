import React from "react";

import RecentTransaction from "../../../shared/recentTransaction";

type Props = {
  transactions: RecentTransaction[];
};

export default function TransactionList({ transactions }: Props) {
  return (
    <div>
      <div
        style={{
          paddingBottom: 15,
          color: "var(--vscode-panelTitle-inactiveForeground)",
        }}
      >
        TRANSACTIONS
      </div>
      {!!transactions.length && (
        <pre>{JSON.stringify(transactions, undefined, 2)}</pre>
      )}
      {!transactions.length && (
        <>As you run the steps in your file, results will appear here.</>
      )}
    </div>
  );
}
