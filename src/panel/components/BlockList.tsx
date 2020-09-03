import React from "react";

import Block from "../../shared/neon/block";
import BlockDetails from "./BlockDetails";
import Hash from "./Hash";
import Table from "./Table";
import Time from "./Time";

type Props = {
  blocks: Block[];
  selectedBlock: number;
  selectBlock: (index: number) => void;
};

export default function BlockList({
  blocks,
  selectedBlock,
  selectBlock,
}: Props) {
  const loadingStyle: React.CSSProperties = {
    textAlign: "center",
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
              parity: block.index % 2 === 0,
              selected: selectedBlock === block.index,
              onClick: () => selectBlock(block.index),
              cells:
                selectedBlock === block.index
                  ? [{ colSpan: 5, content: <BlockDetails block={block} /> }]
                  : [
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
