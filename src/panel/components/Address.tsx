import React from "react";

import AddressNames from "../../shared/addressNames";
import NavLink from "./NavLink";

type Props = {
  address: string;
  addressNames: AddressNames;
  onClick?: (address: string) => void;
};

export default function Address({ address, addressNames, onClick }: Props) {
  const names = addressNames[address];
  const primaryName = names?.length
    ? `${address.substring(0, 4)}..${address.substring(address.length - 4)} (${
        names[0]
      })`
    : address;
  const style: React.CSSProperties = {
    fontFamily: "monospace",
    wordBreak: "break-all",
  };
  const title = names?.length ? `${address}\n (${names.join(", ")})` : address;
  return !!onClick ? (
    <NavLink style={style} title={title} onClick={() => onClick(address)}>
      {primaryName}
    </NavLink>
  ) : (
    <span style={style} title={title}>
      {primaryName}
    </span>
  );
}
