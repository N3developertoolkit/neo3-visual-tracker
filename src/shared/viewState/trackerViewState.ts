import Account from "../neon/account";
import Block from "../neon/block";

type TrackerViewState = {
  view: "tracker";
  panelTitle: string;
  blockHeight: number;
  selectedAddress: Account | null;
  selectedBlock: string;
  selectedTransaction: string;
  startAtBlock: number;
  blocks: Block[];
  paginationDistance: number;
  searchHistory: string[];
};

export default TrackerViewState;
