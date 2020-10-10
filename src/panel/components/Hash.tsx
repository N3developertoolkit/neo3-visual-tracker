import React from "react";

type Props = {
  hash: string;
};

export default function Hash({ hash }: Props) {
  const hashStyle: React.CSSProperties = {
    fontFamily: "monospace",
    wordBreak: "break-all",
  };
  if (hash.indexOf("\n") !== -1) {
    return (
      <span style={hashStyle}>
        {hash.split("\n").map((_, i) => (
          <div key={`${i}_${_}`}>{_}</div>
        ))}
      </span>
    );
  } else {
    return <span style={hashStyle}>{hash}</span>;
  }
}
