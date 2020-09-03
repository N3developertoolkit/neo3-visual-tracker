import React from "react";

import Block from "../../shared/neon/block";
import NavButton from "./NavButton";

type Props = {
  blocks: Block[];
  blockHeight: number;
  blocksPerPage: number;
  startAtBlock: number;
  style?: React.CSSProperties;
  setStartAtBlock: (newStartAtBlock: number) => void;
};

export default function BlockNavigation({
  blocks,
  blockHeight,
  blocksPerPage,
  startAtBlock,
  style,
  setStartAtBlock,
}: Props) {
  if (!blocks.length) {
    return <></>;
  }
  const lastBlock = blocks[blocks.length - 1].index;
  const buttonStyle: React.CSSProperties = {
    margin: "0.25em",
  };
  return (
    <div style={style}>
      <NavButton
        style={buttonStyle}
        disabled={startAtBlock < 0 || startAtBlock >= blockHeight - 1}
        onClick={() => setStartAtBlock(-1)}
      >
        &lt;&lt; Most recent
      </NavButton>
      <NavButton
        style={buttonStyle}
        disabled={startAtBlock < 0 || startAtBlock >= blockHeight - 1}
        onClick={() => {
          const goto = startAtBlock + blocksPerPage;
          setStartAtBlock(goto >= blockHeight ? -1 : goto);
        }}
      >
        &lt; Previous
      </NavButton>
      <NavButton
        style={buttonStyle}
        disabled={lastBlock === 0}
        onClick={() =>
          setStartAtBlock(Math.max(blocksPerPage - 1, lastBlock - 1))
        }
      >
        Next &gt;
      </NavButton>
      <NavButton
        style={buttonStyle}
        disabled={lastBlock === 0}
        onClick={() => setStartAtBlock(blocksPerPage - 1)}
      >
        Oldest &gt;&gt;
      </NavButton>
    </div>
  );
}
