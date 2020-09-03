import React from "react";

import Block from "../../shared/neon/block";
import Hash from "./Hash";
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
      <div>{block.index}</div>
      <Time ts={block.time} />
      <div>Transactions: {block.tx.length}</div>
      <div>
        Hash: <Hash hash={block.hash} />
      </div>
      <div>Size: {block.size} bytes</div>
      <div>Version: {block.version}</div>
      <div>
        Merkle root: <Hash hash={block.merkleroot} />
      </div>
      <div>
        Consensus data: {block.consensusdata.nonce}{" "}
        {block.consensusdata.primary}
      </div>
      <div>Witnesses: {block.witnesses.length}</div>
    </div>
  );
}
