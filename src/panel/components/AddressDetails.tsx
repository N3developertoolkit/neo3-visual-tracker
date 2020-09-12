import React from "react";

import AddressInfo from "../../shared/addressInfo";

type Props = {
  addressInfo: AddressInfo;
};

export default function AddressDetails({ addressInfo }: Props) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontWeight: "bold", fontSize: "1.5rem" }}>
        {addressInfo.address}
      </p>
      <p>
        <small>NEO balance:</small>
      </p>
      <p style={{ fontWeight: "bold", fontSize: "1.25rem" }}>
        {addressInfo.neoBalance} NEO
      </p>
      <p>
        <small>GAS balance:</small>
      </p>
      <p style={{ fontWeight: "bold", fontSize: "1.25rem" }}>
        {addressInfo.gasBalance} GAS
      </p>
    </div>
  );
}
