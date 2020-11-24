import { BlockJson } from "@cityofzion/neon-core/lib/types";
import { TransactionJson } from "@cityofzion/neon-core/lib/tx";

import AddressInfo from "../addressInfo";
import AutoCompleteData from "../autoCompleteData";

type TrackerViewState = {
  view: "tracker";
  panelTitle: string;
  autoCompleteData: AutoCompleteData;
  blockHeight: number;
  blocks: BlockJson[];
  paginationDistance: number;
  searchHistory: string[];
  selectedAddress: AddressInfo | null;
  selectedBlock: BlockJson | null;
  selectedTransaction: TransactionJson | null;
  startAtBlock: number;
};

export default TrackerViewState;
