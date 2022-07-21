import AddressInfo from "../addressInfo";
import AutoCompleteData from "../autoCompleteData";

type ConnectWalletViewState = {
  view: "connectWallet";
  panelTitle: string;
  autoCompleteData: AutoCompleteData;
  address: string;
  addressInfo: AddressInfo | null;
  offline: boolean;
};

export default ConnectWalletViewState;
