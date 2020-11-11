import React from "react";

import Hash from "../Hash";
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
      {transactions.map((entry) => (
        <div
          style={{
            marginBottom: 10,
            backgroundColor: "var(--vscode-editorWidget-background)",
            color: "var(--vscode-editorWidget-foreground)",
            border: "var(--vscode-editorWidget-border)",
            borderRadius: 10,
            padding: 10,
            cursor: entry.tx ? "pointer" : undefined,
          }}
          onClick={entry.tx ? () => {} : undefined}
        >
          <div
            style={{
              color: "var(--vscode-panelTitle-inactiveForeground)",
              fontWeight: "bold",
            }}
          >
            {entry.blockchain}
            <span
              style={{
                float: "right",
                color:
                  entry.state === "error"
                    ? "var(--vscode-errorForeground)"
                    : undefined,
              }}
            >
              {entry.state}
            </span>
          </div>
          <div
            style={{
              paddingTop: 10,
              fontSize: "1.1rem",
            }}
          >
            <Hash hash={entry.txid} />
          </div>
        </div>
      ))}
      {!transactions.length && (
        <>As you run the steps in your file, results will appear here.</>
      )}
    </div>
  );
}
