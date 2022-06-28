import React from "react";

import NavButton from "../NavButton";

type Props = {
  onConnectWallet: () => void;
};

export default function ConnectWallet({ onConnectWallet }: Props) {
  return (
    <>
      <div style={{ margin: 10, textAlign: "left" }}>
        Connect to Wallet Connect
      </div>
      <NavButton style={{ margin: 10 }} onClick={onConnectWallet}>
        Connect
      </NavButton>
    </>
  );
}
