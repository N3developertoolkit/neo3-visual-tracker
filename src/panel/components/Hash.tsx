import React from "react";

type Props = {
  hash: string;
};

export default function Hash({ hash }: Props) {
  return (
    <span
      style={{
        fontFamily: "monospace",
        wordBreak: "break-all",
      }}
    >
      {hash}
    </span>
  );
}
