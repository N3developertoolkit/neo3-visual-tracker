import React from "react";

import WalletViewState from "../../../shared/viewState/walletViewState";
import WalletViewRequest from "../../../shared/messages/walletViewRequest";
import Hash from "../Hash";

type Props = {
  viewState: WalletViewState;
  postMessage: (message: WalletViewRequest) => void;
};

export default function Wallet({ viewState, postMessage }: Props) {
  const address = viewState.address;
  const name =
    viewState.autoCompleteData.addressNames[address].join(", ") ||
    "Unknown wallet";
  return (
    <div style={{ padding: 10 }}>
      <h1>{name}</h1>
      <p style={{ paddingLeft: 20 }}>
        <div style={{ fontWeight: "bold", marginBottom: 10, marginTop: 15 }}>
          Address:
        </div>
        <div
          style={{ cursor: "pointer", paddingLeft: 20 }}
          onClick={() => postMessage({ copyAddress: true })}
        >
          <strong>
            <Hash hash={address} />
          </strong>{" "}
          <em> &mdash; click to copy address to clipboard</em>
        </div>
      </p>
    </div>
  );
}
