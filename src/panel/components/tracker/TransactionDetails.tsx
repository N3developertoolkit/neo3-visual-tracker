import React from "react";
import * as neonCore from "@cityofzion/neon-core";

import AutoCompleteData from "../../../shared/autoCompleteData";
import Address from "../Address";
import Hash from "../Hash";
import MetadataBadge from "../MetadataBadge";
import Script from "./Script";

type Props = {
  autoCompleteData: AutoCompleteData;
  transaction: Partial<neonCore.tx.TransactionJson>;
  selectAddress?: (address: string) => void;
};

export default function TransactionDetails({
  autoCompleteData,
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
      {!!transaction.hash && (
        <MetadataBadge title="TXID">
          <Hash hash={transaction.hash} />
        </MetadataBadge>
      )}
      {!!transaction.sender && (
        <MetadataBadge title="Sender">
          <Address
            address={transaction.sender}
            addressNames={autoCompleteData.addressNames}
            onClick={selectAddress}
          />
        </MetadataBadge>
      )}
      {!!transaction.signers?.length &&
        transaction.signers.map((signer, i) => (
          <MetadataBadge title="Signer" key={i}>
            <Hash hash={signer.account} /> &mdash; {signer.scopes}
          </MetadataBadge>
        ))}
      {!!transaction.size && (
        <MetadataBadge title="Size">{transaction.size} bytes</MetadataBadge>
      )}
      {!!transaction.netfee && (
        <MetadataBadge title="Network fee">{transaction.netfee}</MetadataBadge>
      )}
      {!!transaction.sysfee && (
        <MetadataBadge title="System fee">{transaction.sysfee}</MetadataBadge>
      )}
      {!!transaction.nonce && (
        <MetadataBadge title="Nonce">{transaction.nonce}</MetadataBadge>
      )}
      {!!transaction.validuntilblock && (
        <MetadataBadge title="Valid until">
          {transaction.validuntilblock}
        </MetadataBadge>
      )}
      {!!transaction.version && (
        <MetadataBadge title="Version">{transaction.version}</MetadataBadge>
      )}
      {!!transaction.script && (
        <div style={{ width: "100%" }}>
          <MetadataBadge grow title="Script">
            <Script
              autoCompleteData={autoCompleteData}
              script={transaction.script}
            />
          </MetadataBadge>
        </div>
      )}
      {!!transaction.witnesses?.length &&
        transaction.witnesses.map((witness, i) => (
          <div style={{ width: "100%" }} key={i}>
            <MetadataBadge grow title="Witness">
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
