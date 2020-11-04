import { BlockJson } from "@cityofzion/neon-core/lib/types";
import { TransactionJson } from "@cityofzion/neon-core/lib/tx";

import AddressInfo from "../addressInfo";

type TrackerViewState = {
  view: "tracker";
  panelTitle: string;
  blockHeight: number;
  selectedAddress: AddressInfo | null;
  selectedBlock: BlockJson | null;
  selectedTransaction: TransactionJson | null;
  startAtBlock: number;
  blocks: BlockJson[];
  paginationDistance: number;
  searchHistory: string[];
};

export default TrackerViewState;
