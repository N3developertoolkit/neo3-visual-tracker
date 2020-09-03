import React from "react";

import Block from "../../shared/neon/block";
import Hash from "./Hash";
import MetadataBadge from "./MetadataBadge";
import Table from "./Table";
import Time from "./Time";

type Props = {
  block: Block;
  selectedTransaction: string;
  selectTransaction: (txid: string) => void;
};

export default function BlockDetails({
  block,
  selectedTransaction,
  selectTransaction,
}: Props) {
  const insetStyle: React.CSSProperties = {
    backgroundColor: "var(--vscode-editor-background)",
    color: "var(--vscode-editor-foreground)",
    margin: "0px 20px",
    padding: 10,
    border: "1px solid var(--vscode-editorWidget-border)",
  };
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "stretch",
      }}
    >
      <MetadataBadge title="Index">{block.index}</MetadataBadge>
      <MetadataBadge title="Time">
        <Time ts={block.time} />
      </MetadataBadge>
      <MetadataBadge title="Hash">
        <Hash hash={block.hash} />
      </MetadataBadge>
      <MetadataBadge title="Size">{block.size} bytes</MetadataBadge>
      <MetadataBadge title="Version">{block.version}</MetadataBadge>
      <MetadataBadge title="Merkle root">
        <Hash hash={block.merkleroot} />
      </MetadataBadge>
      <MetadataBadge title="Consensus data">
        {block.consensusdata.nonce} &mdash; {block.consensusdata.primary}
      </MetadataBadge>
      <MetadataBadge title="Witnesses">{block.witnesses.length}</MetadataBadge>
      {block.witnesses.map((witness) => (
        <MetadataBadge title="Witness">
          <div style={{ textAlign: "left" }}>
            <strong>Invocation:</strong> <Hash hash={witness.invocation} />
          </div>
          <div style={{ textAlign: "left", marginTop: 4 }}>
            <strong>Verification:</strong> <Hash hash={witness.verification} />
          </div>
        </MetadataBadge>
      ))}
      {!!block.tx.length && (
        <div style={{ width: "100%" }}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "0.6rem",
              textTransform: "uppercase",
              margin: 2,
            }}
          >
            Transactions:
          </div>
          <Table
            headings={[
              { content: <></> },
              { content: <>Hash</> },
              { content: <>Sender</> },
              { content: <>Size</> },
            ]}
            rows={block.tx.map((tx, i) => ({
              onClick: () => selectTransaction(tx.hash),
              key: tx.hash,
              selected: selectedTransaction === tx.hash,
              cells:
                selectedTransaction === tx.hash
                  ? [
                      {
                        colSpan: 4,
                        content: (
                          <div style={insetStyle}>
                            Selected transaction: {tx.hash}
                          </div>
                        ),
                      },
                    ]
                  : [
                      { content: <>{i + 1}</> },
                      { content: <Hash hash={tx.hash} /> },
                      { content: <Hash hash={tx.sender} /> },
                      { content: <>{tx.size} bytes</> },
                    ],
            }))}
          />
        </div>
      )}
    </div>
  );
}
