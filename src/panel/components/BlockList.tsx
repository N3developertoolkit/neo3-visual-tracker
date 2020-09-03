import React from "react";

import Block from "../../shared/neon/block";
import BlockDetails from "./BlockDetails";
import Hash from "./Hash";
import Table from "./Table";
import Time from "./Time";
import useWindowHeight from "./useWindowHeight";

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
  const windowHeight = useWindowHeight();
  const loadingStyle: React.CSSProperties = {
    textAlign: "center",
    padding: 30,
  };
  const insetStyle: React.CSSProperties = {
    backgroundColor: "var(--vscode-editor-background)",
    color: "var(--vscode-editor-foreground)",
    margin: "0px 20px",
    padding: 10,
    border: "1px solid var(--vscode-editorWidget-border)",
    overflow: "auto",
    maxHeight: windowHeight * 0.4,
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
              onClick:
                selectedBlock === block.index
                  ? undefined
                  : () => selectBlock(block.index),
              cells:
                selectedBlock === block.index
                  ? [
                      {
                        colSpan: 5,
                        content: (
                          <div style={insetStyle}>
                            <BlockDetails block={block} />
                          </div>
                        ),
                      },
                    ]
                  : [
                      { content: <>{block.index}</> },
                      { content: <Time ts={block.time} /> },
                      { content: <>{block.tx.length}</> },
                      { content: <Hash hash={block.hash} /> },
                      { content: <>{block.size} bytes</> },
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
