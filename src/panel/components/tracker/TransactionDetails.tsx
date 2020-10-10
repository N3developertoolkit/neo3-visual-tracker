import React from "react";
import * as neonCore from "@cityofzion/neon-core";

import disassembleScript from "./disassembleScript";
import Hash from "../Hash";
import MetadataBadge from "../MetadataBadge";
import NavLink from "../NavLink";

const tryDisassemble = (script: string) => {
  try {
    return disassembleScript(script) || script;
  } catch {
    return script;
  }
};

type Props = {
  transaction: neonCore.tx.TransactionJson;
  selectAddress: (address: string) => void;
};

export default function TransactionDetails({
  transaction,
  selectAddress,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        alignItems: "stretch",
      }}
    >
      <MetadataBadge title="TXID">
        <Hash hash={transaction.hash || ""} />
      </MetadataBadge>
      <MetadataBadge title="Sender">
        <NavLink onClick={() => selectAddress(transaction.sender)}>
          <Hash hash={transaction.sender} />
        </NavLink>
      </MetadataBadge>
      {transaction.signers.map((signer) => (
        <MetadataBadge title="Signer">
          <Hash hash={signer.account} /> &mdash; {signer.scopes}
        </MetadataBadge>
      ))}
      <MetadataBadge title="Size">{transaction.size} bytes</MetadataBadge>
      <MetadataBadge title="Network fee">{transaction.netfee}</MetadataBadge>
      <MetadataBadge title="System fee">{transaction.sysfee}</MetadataBadge>
      <MetadataBadge title="Nonce">{transaction.nonce}</MetadataBadge>
      <MetadataBadge title="Valid until">
        {transaction.validuntilblock}
      </MetadataBadge>
      <MetadataBadge title="Version">{transaction.version}</MetadataBadge>
      <div style={{ width: "100%" }}>
        <MetadataBadge title="Script">
          <Hash hash={tryDisassemble(transaction.script)} />
        </MetadataBadge>
      </div>
      {transaction.witnesses.map((witness) => (
        <div style={{ width: "100%" }}>
          <MetadataBadge title="Witness">
            <div>
              <strong>
                <small>Invocation</small>
              </strong>
              <br />
              <Hash hash={witness.invocation} />
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>
                <small>Verification</small>
              </strong>
              <br />
              <Hash hash={witness.verification} />
            </div>
          </MetadataBadge>
        </div>
      ))}
    </div>
  );
}
