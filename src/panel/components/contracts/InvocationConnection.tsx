import React from "react";

import NavButton from "../NavButton";

type Props = {
  connectedTo: string;
  connectionState: "ok" | "connecting" | "none";
  initiateConnection: () => void;
  disconnect: () => void;
};

export default function InvocationConnection({
  connectedTo,
  connectionState,
  initiateConnection,
  disconnect,
}: Props) {
  return (
    <div style={{ textAlign: "center" }}>
      {!!connectedTo && (
        <>
          {connectionState === "ok" && (
            <>
              <p>
                Connected to <strong>{connectedTo}</strong>
              </p>
              <NavButton onClick={disconnect}>Disconnect</NavButton>
            </>
          )}
          {connectionState === "connecting" && (
            <>
              <p>
                Connecting to <strong>{connectedTo}</strong>&hellip;
              </p>
              <NavButton onClick={disconnect}>Cancel</NavButton>
            </>
          )}
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
