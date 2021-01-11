import React from "react";

import AddressInfo from "../../../shared/addressInfo";
import AutoCompleteData from "../../../shared/autoCompleteData";

type Props = {
  addressInfo: AddressInfo;
  autoCompleteData: AutoCompleteData;
};

export default function AddressDetails({
  addressInfo,
  autoCompleteData,
}: Props) {
  const names = autoCompleteData.addressNames[addressInfo.address];
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontWeight: "bold", fontSize: "1.5rem" }}>
        {addressInfo.address}
        {!!names && !!names.length && (
          <>
            <br />
            <span style={{ fontSize: "1.25rem", fontWeight: "normal" }}>
              ({names.map((_) => `"${_}"`).join(", ")})
            </span>
          </>
        )}
      </p>
      <p>
        <small>NEO balance:</small>
      </p>
      <p style={{ fontWeight: "bold", fontSize: "1.25rem" }}>
        {addressInfo.neoBalance.toLocaleString()} NEO
      </p>
      <p>
        <small>GAS balance:</small>
      </p>
      <p style={{ fontWeight: "bold", fontSize: "1.25rem" }}>
        {(addressInfo.gasBalance / 100000000.0).toLocaleString()} GAS
      </p>
    </div>
  );
}
