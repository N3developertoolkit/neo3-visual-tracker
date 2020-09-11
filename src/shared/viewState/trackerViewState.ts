import { BlockJson } from "@cityofzion/neon-core/lib/types";

type TrackerViewState = {
  view: "tracker";
  panelTitle: string;
  blockHeight: number;
  selectedAddress: any | null;
  selectedBlock: string;
  selectedTransaction: string;
  startAtBlock: number;
  blocks: BlockJson[];
  paginationDistance: number;
  searchHistory: string[];
};

export default TrackerViewState;
