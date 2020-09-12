import { BlockJson } from "@cityofzion/neon-core/lib/types";

import AddressInfo from "../addressInfo";

type TrackerViewState = {
  view: "tracker";
  panelTitle: string;
  blockHeight: number;
  selectedAddress: AddressInfo | null;
  selectedBlock: string;
  selectedTransaction: string;
  startAtBlock: number;
  blocks: BlockJson[];
  paginationDistance: number;
  searchHistory: string[];
};

export default TrackerViewState;
