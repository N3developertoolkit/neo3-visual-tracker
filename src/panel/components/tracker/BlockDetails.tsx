import React from "react";
import { BlockJson } from "@cityofzion/neon-core/lib/types";
import { TransactionJson } from "@cityofzion/neon-core/lib/tx";

import Address from "../Address";
import AutoCompleteData from "../../../shared/autoCompleteData";
import Hash from "../Hash";
import MetadataBadge from "../MetadataBadge";
import Script from "./Script";
import Table from "../Table";
import Time from "../Time";

type Props = {
  autoCompleteData: AutoCompleteData;
  block: Partial<BlockJson>;
  selectedTransactionHash?: string;
  selectAddress: (address: string) => void;
  selectTransaction: (txid: string) => void;
};

export default function BlockDetails({
  autoCompleteData,
  block,
  selectedTransactionHash,
  selectAddress,
  selectTransaction,
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
      {!!block.time && (
        <MetadataBadge title="Time">
          <Time ts={block.time} />
        </MetadataBadge>
      )}
      {!!block.hash && (
        <MetadataBadge title="Block hash">
          <Hash hash={block.hash} />
        </MetadataBadge>
      )}
      <MetadataBadge title="Size">{block.size} bytes</MetadataBadge>
      <MetadataBadge title="Version">{block.version}</MetadataBadge>
      {!!block.merkleroot && (
        <MetadataBadge title="Merkle root">
          <Hash hash={block.merkleroot} />
        </MetadataBadge>
      )}
      {!!block.consensusdata && (
        <MetadataBadge title="Consensus data">
          <Hash hash={block.consensusdata.nonce} /> &mdash;{" "}
          {block.consensusdata.primary}
        </MetadataBadge>
      )}
      {!!block.witnesses &&
        block.witnesses.map((witness) => (
          <MetadataBadge
            title="Witness"
            key={`${witness.invocation}-${witness.verification}`}
          >
            <div>
              <strong>
                <small>Invocation</small>
              </strong>
              <br />
              <Script
                autoCompleteData={autoCompleteData}
                script={witness.invocation}
                selectAddress={selectAddress}
              />
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>
                <small>Verification</small>
              </strong>
              <br />
              <Script
                autoCompleteData={autoCompleteData}
                script={witness.verification}
                selectAddress={selectAddress}
              />
            </div>
          </MetadataBadge>
        ))}
      {!!block.tx?.length && (
        <div style={{ width: "100%", marginTop: 10 }}>
          <Table
            headings={[
              { content: <>TXID</> },
              { content: <>Sender</> },
              { content: <>Size</> },
            ]}
            rows={block.tx.map((tx: Partial<TransactionJson>) => ({
              onClick:
                selectedTransactionHash === tx.hash
                  ? () => selectTransaction("")
                  : () => selectTransaction(tx.hash || ""),
              key: tx.hash,
              cells: [
                { content: <Hash hash={tx.hash || ""} /> },
                {
                  content: !!tx.sender ? (
                    <Address
                      address={tx.sender}
                      addressNames={autoCompleteData.addressNames}
                    />
                  ) : (
                    <>Unknown sender</>
                  ),
                },
                { content: <>{tx.size} bytes</> },
              ],
              selected: selectedTransactionHash === tx.hash,
            }))}
          />
        </div>
      )}
    </div>
  );
}
