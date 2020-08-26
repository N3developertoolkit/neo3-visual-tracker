import Block from "../neon/block";

type TrackerViewState = {
  view: "tracker";
  panelTitle: string;
  blockHeight: number;
  startAtBlock?: number;
  blocks?: Block[];
};

export default TrackerViewState;
