import Transaction from "./transaction";
import Witness from "./witness";

type Block = {
  consensusdata: {
    nonce: string;
    primary: number;
  };
  hash: string;
  index: number;
  merkleroot: string;
  nextconsensus: string;
  nextblockhash?: string;
  previousblockhash: string;
  size: number;
  time: number;
  tx: Transaction[];
  version: number;
  witnesses: Witness[];
};

export default Block;
