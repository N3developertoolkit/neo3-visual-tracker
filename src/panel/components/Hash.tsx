import React from "react";

type Props = {
  hash: string;
};

export default function Hash({ hash }: Props) {
  const hashStyle: React.CSSProperties = {
    fontFamily: "monospace",
    wordBreak: "break-all",
  };
  return <span style={hashStyle}>{hash}</span>;
}
