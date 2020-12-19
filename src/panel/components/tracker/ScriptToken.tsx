import React from "react";
import * as neonCore from "@cityofzion/neon-core";

import Address from "../Address";
import AutoCompleteData from "../../../shared/autoCompleteData";

const reverseBytes = (token: string) =>
  token
    .match(/[a-f0-9]{2}/g)
    ?.reverse()
    .join("") || "";

type Props = {
  autoCompleteData: AutoCompleteData;
  token: string;
  selectAddress?: (address: string) => void;
};

export default function ScriptToken({
  autoCompleteData,
  token,
  selectAddress,
}: Props) {
  const style: React.CSSProperties = {
    marginRight: "1em",
  };
  token = token.trim();

  const contractHashes = Object.keys(autoCompleteData.contractNames);
  for (const contractHash of contractHashes) {
    const name = autoCompleteData.contractNames[contractHash] || "contract";
    const contractHashRaw = reverseBytes(
      contractHash.replace(/^0x/g, "").toLowerCase()
    );
    if (token === contractHashRaw) {
      return (
        <span
          style={style}
          title={`Contract:\n ${contractHashRaw}\n  (${name})`}
        >
          <strong>
            {contractHashRaw.substring(0, 4)}..
            {contractHashRaw.substring(contractHashRaw.length - 4)} (
          </strong>
          <i>{name}</i>
          <strong>)</strong>
        </span>
      );
    }
  }

  if (token.length == 40) {
    try {
      const address = neonCore.wallet.getAddressFromScriptHash(
        reverseBytes(token)
      );
      if (address.startsWith("N")) {
        return (
          <span style={style}>
            <strong title={token}>
              {token.substring(0, 4)}..
              {token.substring(token.length - 4)}
            </strong>{" "}
            <Address
              address={address}
              addressNames={autoCompleteData.addressNames}
              onClick={selectAddress}
            />
          </span>
        );
      }
    } catch {}
  }

  try {
    const asText = Buffer.from(token, "hex")
      .toString("ascii")
      .replace(/\\n/g, " ")
      .trim();
    if (asText.length > 0) {
      let printableAscii = true;
      for (let i = 0; i < asText.length; i++) {
        const c = asText.charCodeAt(i);
        printableAscii = printableAscii && c >= 32 && c <= 126;
      }
      if (printableAscii) {
        return (
          <span
            style={style}
            title={`Detected text:\n0x${token} =\n"${asText}"`}
          >
            <strong>
              {" "}
              {token.length > 8 ? (
                <>
                  {token.substring(0, 4)}..
                  {token.substring(token.length - 4)}
                </>
              ) : (
                <>{token}</>
              )}{" "}
              ("
            </strong>
            <i>{asText}</i>
            <strong>")</strong>
          </span>
        );
      }
    }
  } catch {}

  try {
    const numericalValue = parseInt(reverseBytes(token), 16);
    if (
      !!token.match(/^([a-f0-9][a-f0-9])+$/i) &&
      !isNaN(numericalValue) &&
      numericalValue < Math.pow(2, 32)
    ) {
      return (
        <span style={style} title={`0x${token} = ${numericalValue}`}>
          <strong>
            {" "}
            {token.length > 8 ? (
              <>
                {token.substring(0, 4)}..
                {token.substring(token.length - 4)}
              </>
            ) : (
              <>{token}</>
            )}{" "}
            (
          </strong>
          <i>{numericalValue}</i>
          <strong>)</strong>
        </span>
      );
    }
  } catch {}

  return <span style={style}>{token}</span>;
}
