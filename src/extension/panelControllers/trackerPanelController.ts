import * as neonCore from "@cityofzion/neon-core";
import * as vscode from "vscode";

import Block from "../../shared/neon/block";
import PanelControllerBase from "./panelControllerBase";
import TrackerViewState from "../../shared/viewState/trackerViewState";

const LOG_PREFIX = "[TrackerPanelController]";
const REFRESH_INTERVAL_MS = 1000 * 3; // check for new blocks every 3 seconds
const BLOCKS_PER_PAGE = 25;
const BLOCK_CACHE_SIZE = 1024;

export default class TrackerPanelController extends PanelControllerBase<
  TrackerViewState
> {
  private readonly rpcClient: neonCore.rpc.RPCClient;

  private cachedBlocks: Block[];
  private timeout?: NodeJS.Timeout;

  constructor(context: vscode.ExtensionContext, rpcUrl: string) {
    super(
      { view: "tracker", panelTitle: "Block Explorer", blockHeight: 0 },
      context
    );
    this.cachedBlocks = [];
    this.rpcClient = new neonCore.rpc.RPCClient(rpcUrl);
    this.refreshLoop();
  }

  onClose() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  private async getBlock(blockNumber: number): Promise<Block> {
    const cachedBlock = this.cachedBlocks.find((_) => _.index === blockNumber);
    if (cachedBlock) {
      return cachedBlock;
    }
    console.log(LOG_PREFIX, "Retrieving block", blockNumber);
    const block = (await this.rpcClient.getBlock(blockNumber)) as Block;
    if (blockNumber + 1 < this.viewState.blockHeight) {
      // never cache head block
      if (this.cachedBlocks.length === BLOCK_CACHE_SIZE) {
        this.cachedBlocks.shift();
      }
      this.cachedBlocks.push(block);
    }
    return block;
  }

  private async onNewBlockAvailable() {
    if (this.viewState.startAtBlock) {
      return;
    }
    let newBlocks: Block[] = [];
    for (let i = 0; i < BLOCKS_PER_PAGE; i++) {
      const blockNumber = this.viewState.blockHeight - i - 1;
      if (blockNumber >= 0) {
        newBlocks.push(await this.getBlock(blockNumber));
      }
    }
    this.updateViewState({ blocks: newBlocks });
  }

  private async refreshLoop() {
    try {
      const currentBlockHeight = await this.rpcClient.getBlockCount();
      if (currentBlockHeight > this.viewState.blockHeight) {
        console.log(LOG_PREFIX, "New block available", currentBlockHeight);
        this.updateViewState({
          blockHeight: currentBlockHeight,
          panelTitle: `Block Explorer: ${currentBlockHeight}`,
        });
        await this.onNewBlockAvailable();
      }
    } finally {
      this.timeout = <any>(
        setTimeout(() => this.refreshLoop(), REFRESH_INTERVAL_MS)
      );
    }
  }
}
