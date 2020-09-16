import React from "react";

import NavButton from "./NavButton";

type Props = {
  connectedTo: string;
  initiateConnection: () => void;
  disconnect: () => void;
};

export default function InvocationConnection({
  connectedTo,
  initiateConnection,
  disconnect,
}: Props) {
  return (
    <div style={{ textAlign: "center" }}>
      {!!connectedTo && (
        <>
          <p>
            Connected to <strong>{connectedTo}</strong>
          </p>
          <NavButton onClick={disconnect}>Disconnect</NavButton>
        </>
      )}
      {!connectedTo && (
        <>
          <p>Connect to a blockchain to enable advanced editing features.</p>
          <NavButton onClick={initiateConnection}>Connect</NavButton>
        </>
      )}
    </div>
  );
}
