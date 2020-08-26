import React from "react";

type Props = {
  hash: string;
};

export default function Hash({ hash }: Props) {
  const hashStyle: React.CSSProperties = {
    fontFamily: "monospace",
  };
  return <span style={hashStyle}>{hash}</span>;
}
