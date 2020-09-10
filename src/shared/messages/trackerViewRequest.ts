type TrackerViewRequest = {
  selectAddress?: string;
  selectBlock?: string;
  selectTransaction?: string;
  setStartAtBlock?: number;
  search?: string;
};

export default TrackerViewRequest;
