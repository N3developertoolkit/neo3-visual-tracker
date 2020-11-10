import React from "react";

type Props = {
  transactions: any[];
};

export default function TransactionList({ transactions }: Props) {
  return (
    <div>
      <pre>{JSON.stringify(transactions, undefined, 2)}</pre>
    </div>
  );
}
