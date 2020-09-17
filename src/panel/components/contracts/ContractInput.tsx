import React from "react";
import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

type Props = {
  contract?: string;
  baseHref: string;
  contracts: { [hashOrNefFile: string]: ContractManifestJson };
  nefHints: { [hash: string]: string };
  setContract: (newValue: string) => void;
};

export default function ContractInput({
  contract,
  baseHref,
  contracts,
  nefHints,
  setContract,
}: Props) {
  return <div>{contract}</div>;
}
