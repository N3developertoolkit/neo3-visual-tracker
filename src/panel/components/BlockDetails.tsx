import React from "react";

import Block from "../../shared/neon/block";
import Hash from "./Hash";
import MetadataBadge from "./MetadataBadge";
import Table from "./Table";
import Time from "./Time";

type Props = {
  block: Block;
};

export default function BlockDetails({ block }: Props) {
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
      <MetadataBadge title="Transactions">{block.tx.length}</MetadataBadge>
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
    </div>
  );
}
