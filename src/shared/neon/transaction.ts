import Witness from "./witness";

type Transaction = {
  hash: string;
  size: number;
  version: number;
  nonce: number;
  sender: string;
  sysfee: string;
  netfee: string;
  validuntilblock: number;
  signers: { account: string; scopes: string }[];
  attributes: any[];
  script: string;
  witnesses: Witness[];
};

export default Transaction;
