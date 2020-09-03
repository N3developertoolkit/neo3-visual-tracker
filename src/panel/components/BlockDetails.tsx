import React from "react";

import Block from "../../shared/neon/block";
import Hash from "./Hash";
import MetadataBadge from "./MetadataBadge";
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
        justifyContent: "space-evenly",
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
    </div>
  );
}
