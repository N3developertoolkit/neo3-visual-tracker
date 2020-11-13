import * as vscode from "vscode";

import PanelControllerBase from "./panelControllerBase";
import QuickStartViewRequest from "../../shared/messages/quickStartFileViewRequest";
import QuickStartViewState from "../../shared/viewState/quickStartViewState";

const LOG_PREFIX = "[QuickStartPanelController]";

export default class QuickStartPanelController extends PanelControllerBase<
  QuickStartViewState,
  QuickStartViewRequest
> {
  constructor(context: vscode.ExtensionContext, panel: vscode.WebviewView) {
    super(
      {
        view: "quickStart",
        panelTitle: "",
      },
      context,
      panel
    );
  }

  onClose() {}

  protected async onRequest() {}
}
