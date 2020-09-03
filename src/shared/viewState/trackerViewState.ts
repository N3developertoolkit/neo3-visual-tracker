import Block from "../neon/block";

type TrackerViewState = {
  view: "tracker";
  panelTitle: string;
  blockHeight: number;
  selectedBlock: string;
  selectedTransaction: string;
  startAtBlock: number;
  blocks: Block[];
  paginationDistance: number;
};

export default TrackerViewState;
