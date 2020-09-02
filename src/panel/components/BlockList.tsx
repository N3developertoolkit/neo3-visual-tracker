import React from "react";

import Block from "../../shared/neon/block";
import Hash from "./Hash";
import Table from "./Table";
import Time from "./Time";

type Props = {
  blocks: Block[];
};

export default function BlockList({ blocks }: Props) {
  const tableStyle: React.CSSProperties = {
    width: "100%",
  };
  const cellStyle: React.CSSProperties = {
    textAlign: "center",
    padding: 5,
  };
  const loadingStyle: React.CSSProperties = {
    ...cellStyle,
    padding: 30,
  };
  return (
    <Table
      headings={[
        { content: <>Index</> },
        { content: <>Time</> },
        { content: <>Transactions</> },
        { content: <>Hash</> },
        { content: <>Size</> },
      ]}
      rows={
        blocks.length
          ? blocks.map((block) => ({
              key: block.hash,
              cells: [
                { content: <>{block.index}</> },
                { content: <Time ts={block.time} /> },
                { content: <>{block.tx.length}</> },
                { content: <Hash hash={block.hash} /> },
                { content: <>{block.size}</> },
              ],
            }))
          : [
              {
                key: "loading",
                cells: [
                  {
                    colSpan: 5,
                    content: <span style={loadingStyle}>Loading&hellip;</span>,
                  },
                ],
              },
            ]
      }
    />
  );
}
