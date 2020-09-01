import React from "react";

import Block from "../../shared/neon/block";

type Props = {
  blocks: Block[];
  blockHeight: number;
  blocksPerPage: number;
  startAtBlock: number;
  setStartAtBlock: (newStartAtBlock: number) => void;
};

export default function BlockNavigation({
  blocks,
  blockHeight,
  blocksPerPage,
  startAtBlock,
  setStartAtBlock,
}: Props) {
  if (!blocks.length) {
    return <></>;
  }
  const lastBlock = blocks[blocks.length - 1].index;
  return (
    <div>
      <button
        type="button"
        disabled={startAtBlock < 0 || startAtBlock >= blockHeight - 1}
        onClick={() => setStartAtBlock(-1)}
      >
        Most recent
      </button>
      <button
        type="button"
        disabled={startAtBlock < 0 || startAtBlock >= blockHeight - 1}
        onClick={() => {
          const goto = startAtBlock + blocksPerPage;
          setStartAtBlock(goto >= blockHeight ? -1 : goto);
        }}
      >
        Previous
      </button>
      <button
        type="button"
        disabled={lastBlock === 0}
        onClick={() =>
          setStartAtBlock(Math.max(blocksPerPage - 1, lastBlock - 1))
        }
      >
        Next
      </button>
      <button
        type="button"
        disabled={lastBlock === 0}
        onClick={() => setStartAtBlock(blocksPerPage - 1)}
      >
        Oldest
      </button>
    </div>
  );
}
