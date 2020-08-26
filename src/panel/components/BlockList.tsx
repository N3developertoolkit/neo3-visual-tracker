import React from "react";

import Block from "../../shared/neon/block";
import Hash from "./Hash";
import Time from "./Time";

type Props = {
  blocks?: Block[];
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
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={cellStyle}>Index</th>
          <th style={cellStyle}>Time</th>
          <th style={cellStyle}>Transactions</th>
          <th style={cellStyle}>Hash</th>
          <th style={cellStyle}>Size</th>
        </tr>
      </thead>
      <tbody>
        {!blocks?.length && (
          <tr>
            <td colSpan={5} style={loadingStyle}>
              Loading&hellip;
            </td>
          </tr>
        )}
        {!!blocks &&
          !!blocks.length &&
          blocks.map((block) => (
            <tr key={block.index}>
              <td style={cellStyle}>{block.index}</td>
              <td style={cellStyle}>
                <Time ts={block.time} />
              </td>
              <td style={cellStyle}>{block.tx.length}</td>
              <td style={cellStyle}>
                <Hash hash={block.hash} />
              </td>
              <td style={cellStyle}>{block.size}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
