import * as vscode from "vscode";

import AutoComplete from "../autoComplete";
import ContractViewRequest from "../../shared/messages/contractViewRequest";
import ContractViewState from "../../shared/viewState/contractViewState";
import Log from "../../shared/log";
import PanelControllerBase from "./panelControllerBase";

const LOG_PREFIX = "ContractPanelController";

export default class ContractPanelController extends PanelControllerBase<
  ContractViewState,
  ContractViewRequest
> {
  constructor(
    context: vscode.ExtensionContext,
    private readonly contractHash: string,
    autoComplete: AutoComplete
  ) {
    super(
      {
        view: "contract",
        panelTitle:
          autoComplete.data.contractNames[contractHash] || contractHash,
        autoCompleteData: autoComplete.data,
        contractHash,
      },
      context
    );
    autoComplete.onChange((autoCompleteData) => {
      const name = autoCompleteData.contractNames[contractHash] || contractHash;
      this.updateViewState({ panelTitle: name, autoCompleteData });
    });
  }

  onClose() {}

  protected async onRequest(request: ContractViewRequest) {
    Log.log(LOG_PREFIX, `Request: ${JSON.stringify(request)}`);
    if (request.copyHash) {
      await vscode.env.clipboard.writeText(this.contractHash);
      vscode.window.showInformationMessage(
        `Contract hash copied to clipboard: ${this.contractHash}`
      );
    }
  }
}
