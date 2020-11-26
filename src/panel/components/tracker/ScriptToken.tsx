import React from "react";

import ContractNames from "../../../shared/contractNames";

type Props = {
  contractNames: ContractNames;
  token: string;
};

export default function ScriptToken({ contractNames, token }: Props) {
  const style: React.CSSProperties = {
    marginRight: "1em",
  };
  token = token.trim();
  const contractHashes = Object.keys(contractNames);
  for (const contractHash of contractHashes) {
    const allNames = contractNames[contractHash] || [];
    const firstName = allNames[0] || "contract";
    const contractHashRaw = contractHash
      .replace(/^0x/g, "")
      .toLowerCase()
      .match(/[a-f0-9]{2}/g)
      ?.reverse()
      .join("");
    if (token === contractHashRaw) {
      return (
        <strong
          style={style}
          title={`${contractHashRaw}\n (${allNames.join(", ")})`}
        >
          {contractHashRaw.substring(0, 4)}..
          {contractHashRaw.substring(contractHashRaw.length - 4)} (
          <i>#{firstName}</i>)
        </strong>
      );
    }
  }
  return <span style={style}>{token}</span>;
}
