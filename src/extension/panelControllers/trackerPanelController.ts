import * as neonCore from "@cityofzion/neon-core";
import * as vscode from "vscode";

import PanelControllerBase from "./panelControllerBase";
import TrackerViewState from "../../shared/viewState/trackerViewState";

export default class TrackerPanelController extends PanelControllerBase<
  TrackerViewState
> {
  private readonly interval: NodeJS.Timeout;

  constructor(context: vscode.ExtensionContext) {
    super({ view: "tracker", panelTitle: "Block Explorer" }, context);

    const rpcClient = new neonCore.rpc.RPCClient("http://seed1t.neo.org:20332");
    this.interval = setInterval(async () => {
      const blockHeight = await rpcClient.getBlockCount();
      this.updateViewState({
        blockHeight,
        panelTitle: `Block Explorer: ${blockHeight}`,
      });
    }, 5000);
  }

  onClose() {
    clearInterval(this.interval);
  }
}
