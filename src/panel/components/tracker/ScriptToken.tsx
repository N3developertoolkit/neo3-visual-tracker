import React from "react";
import * as neonCore from "@cityofzion/neon-core";

import AutoCompleteData from "../../../shared/autoCompleteData";

type Props = {
  autoCompleteData: AutoCompleteData;
  token: string;
};

export default function ScriptToken({ autoCompleteData, token }: Props) {
  const style: React.CSSProperties = {
    marginRight: "1em",
  };
  token = token.trim();

  const contractHashes = Object.keys(autoCompleteData.contractNames);
  for (const contractHash of contractHashes) {
    const allNames = autoCompleteData.contractNames[contractHash] || [];
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
          title={`Contract:\n ${contractHashRaw}\n  (${allNames.join(", ")})`}
        >
          {contractHashRaw.substring(0, 4)}..
          {contractHashRaw.substring(contractHashRaw.length - 4)} (#
          <i>{firstName}</i>)
        </strong>
      );
    }
  }

  const addresses = Object.keys(autoCompleteData.addressNames);
  for (const address of addresses) {
    const allNames = autoCompleteData.addressNames[address] || [];
    const firstName = allNames[0] || "address";
    const scriptHash = neonCore.wallet
      .getScriptHashFromAddress(address)
      .match(/[a-f0-9]{2}/g)
      ?.reverse()
      .join("");
    if (token === scriptHash) {
      return (
        <strong
          style={style}
          title={`Address:\n ${address}\n  (${allNames.join(", ")})`}
        >
          {scriptHash.substring(0, 4)}..
          {scriptHash.substring(scriptHash.length - 4)} (@<i>{firstName}</i>)
        </strong>
      );
    } else {
      console.log(token, "!==", scriptHash);
    }
  }

  return <span style={style}>{token}</span>;
}
