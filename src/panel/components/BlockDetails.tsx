import React from "react";
import { BlockJson } from "@cityofzion/neon-core/lib/types";

import Hash from "./Hash";
import MetadataBadge from "./MetadataBadge";
import Table from "./Table";
import Time from "./Time";
import TransactionDetails from "./TransactionDetails";

type Props = {
  block: BlockJson;
  selectedTransaction: string;
  selectAddress: (address: string) => void;
  selectTransaction: (txid: string) => void;
};

export default function BlockDetails({
  block,
  selectedTransaction,
  selectAddress,
  selectTransaction,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        alignItems: "stretch",
      }}
    >
      <MetadataBadge title="Index">{block.index}</MetadataBadge>
      <MetadataBadge title="Time">
        <Time ts={block.time} />
      </MetadataBadge>
      <MetadataBadge title="Block hash">
        <Hash hash={block.hash} />
      </MetadataBadge>
      <MetadataBadge title="Size">{block.size} bytes</MetadataBadge>
      <MetadataBadge title="Version">{block.version}</MetadataBadge>
      <MetadataBadge title="Merkle root">
        <Hash hash={block.merkleroot} />
      </MetadataBadge>
      <MetadataBadge title="Consensus data">
        <Hash hash={block.consensusdata.nonce} /> &mdash;{" "}
        {block.consensusdata.primary}
      </MetadataBadge>
      <MetadataBadge title="Witnesses">{block.witnesses.length}</MetadataBadge>
      {block.witnesses.map((witness) => (
        <MetadataBadge title="Witness">
          <div>
            <strong>
              <small>Invocation</small>
            </strong>
            <br />
            <Hash hash={witness.invocation} />
          </div>
          <div style={{ marginTop: 4 }}>
            <strong>
              <small>Verification</small>
            </strong>
            <br />
            <Hash hash={witness.verification} />
          </div>
        </MetadataBadge>
      ))}
      {!!block.tx.length && (
        <div style={{ width: "100%", marginTop: 10 }}>
          <Table
            headings={[
              { content: <>TXID</> },
              { content: <>Sender</> },
              { content: <>Size</> },
            ]}
            rows={block.tx
              .map((tx) => ({
                onClick:
                  selectedTransaction === tx.hash
                    ? () => selectTransaction("")
                    : () => selectTransaction(tx.hash || ""),
                key: tx.hash,
                cells: [
                  { content: <Hash hash={tx.hash || ""} /> },
                  { content: <Hash hash={tx.sender} /> },
                  { content: <>{tx.size} bytes</> },
                ],
                annotation:
                  selectedTransaction === tx.hash ? (
                    <TransactionDetails
                      transaction={tx}
                      selectAddress={selectAddress}
                    />
                  ) : undefined,
              }))}
          />
        </div>
      )}
    </div>
  );
}