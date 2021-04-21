import AutoCompleteData from "../autoCompleteData";

type WalletViewState = {
  view: "wallet";
  panelTitle: string;
  autoCompleteData: AutoCompleteData;
  address: string;
};

export default WalletViewState;
