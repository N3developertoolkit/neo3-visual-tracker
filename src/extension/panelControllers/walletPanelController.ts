import * as vscode from "vscode";

import AutoComplete from "../autoComplete";
import Log from "../../shared/log";
import PanelControllerBase from "./panelControllerBase";
import WalletViewRequest from "../../shared/messages/walletViewRequest";
import WalletViewState from "../../shared/viewState/walletViewState";

const LOG_PREFIX = "WalletPanelController";

export default class WalletPanelController extends PanelControllerBase<
  WalletViewState,
  WalletViewRequest
> {
  constructor(
    context: vscode.ExtensionContext,
    private readonly address: string,
    autoComplete: AutoComplete
  ) {
    super(
      {
        view: "wallet",
        panelTitle: autoComplete.data.addressNames[address][0] || address,
        autoCompleteData: autoComplete.data,
        address,
      },
      context
    );
    autoComplete.onChange((autoCompleteData) => {
      const name = autoComplete.data.addressNames[address][0] || address;
      this.updateViewState({ panelTitle: name, autoCompleteData });
    });
  }

  onClose() {}

  protected async onRequest(request: WalletViewRequest) {
    Log.log(LOG_PREFIX, `Request: ${JSON.stringify(request)}`);
    if (request.copyAddress) {
      await vscode.env.clipboard.writeText(this.address);
      vscode.window.showInformationMessage(
        `Wallet address copied to clipboard: ${this.address}`
      );
    }
  }
}
