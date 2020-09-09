import * as neonCore from "@cityofzion/neon-core";
import * as vscode from "vscode";

import Block from "../../shared/neon/block";
import PanelControllerBase from "./panelControllerBase";
import TrackerViewRequest from "../../shared/messages/trackerViewRequest";
import TrackerViewState from "../../shared/viewState/trackerViewState";
import Transaction from "../../shared/neon/transaction";

const LOG_PREFIX = "[TrackerPanelController]";
const REFRESH_INTERVAL_MS = 1000 * 3; // check for new blocks every 3 seconds
const BLOCKS_PER_PAGE = 40;
const PAGINATION_DISTANCE = 15;
const BLOCK_CACHE_SIZE = 1024;
const TRANSACTION_CACHE_SIZE = 1024;

export default class TrackerPanelController extends PanelControllerBase<
  TrackerViewState,
  TrackerViewRequest
> {
  private readonly rpcClient: neonCore.rpc.RPCClient;

  private cachedBlocks: Block[];
  private cachedTransactions: Transaction[];
  private closed: boolean;

  constructor(context: vscode.ExtensionContext, rpcUrl: string) {
    super(
      {
        view: "tracker",
        panelTitle: `Block Explorer: ${rpcUrl}`,
        blockHeight: 0,
        paginationDistance: PAGINATION_DISTANCE,
        blocks: [],
        selectedTransaction: "",
        selectedBlock: "",
        startAtBlock: -1,
      },
      context
    );
    this.closed = false;
    this.cachedBlocks = [];
    this.cachedTransactions = [];
    this.rpcClient = new neonCore.rpc.RPCClient(rpcUrl);
    this.refreshLoop();
  }

  onClose() {
    this.closed = true;
  }

  protected async onRequest(request: TrackerViewRequest) {
    if (request.setStartAtBlock !== undefined) {
      await this.updateViewState({
        startAtBlock: request.setStartAtBlock,
        blocks: await this.getBlocks(
          request.setStartAtBlock,
          this.viewState.blockHeight
        ),
      });
    }
    if (request.selectBlock !== undefined) {
      const selectedBlock = await this.getBlock(request.selectBlock);
      const startAtBlock = Math.min(
        this.viewState.blockHeight - 1,
        selectedBlock.index + 2
      );
      await this.updateViewState({
        selectedBlock: selectedBlock.hash,
        startAtBlock,
        blocks: await this.getBlocks(startAtBlock, this.viewState.blockHeight),
      });
    }
    if (request.selectTransaction !== undefined) {
      if (request.selectTransaction) {
        const selectedTransaction = await this.getTransaction(
          request.selectTransaction
        );
        const selectedBlock = await this.getBlock(
          selectedTransaction.blockhash
        );
        const startAtBlock = Math.min(
          this.viewState.blockHeight - 1,
          selectedBlock.index + 2
        );
        await this.updateViewState({
          selectedTransaction: selectedTransaction.hash,
          selectedBlock: selectedBlock.hash,
          startAtBlock,
          blocks: await this.getBlocks(
            startAtBlock,
            this.viewState.blockHeight
          ),
        });
      } else {
        await this.updateViewState({ selectedTransaction: "" });
      }
    }
  }

  private async getBlock(indexOrHash: string | number): Promise<Block> {
    const cachedBlock = this.cachedBlocks.find(
      (_) => _.index === indexOrHash || _.hash === indexOrHash
    );
    if (cachedBlock) {
      return cachedBlock;
    }
    console.log(LOG_PREFIX, "Retrieving block", indexOrHash);
    const block = (await this.rpcClient.getBlock(indexOrHash)) as Block;
    if (block.index < this.viewState.blockHeight - 1) {
      // never cache head block
      if (this.cachedBlocks.length === BLOCK_CACHE_SIZE) {
        this.cachedBlocks.shift();
      }
      this.cachedBlocks.push(block);
    }
    return block;
  }

  private async getBlocks(startAtBlock: number, blockHeight: number) {
    let newBlocks: Promise<Block>[] = [];
    startAtBlock =
      startAtBlock < 0 || startAtBlock >= blockHeight
        ? blockHeight - 1
        : startAtBlock;
    for (let i = 0; i < BLOCKS_PER_PAGE; i++) {
      const blockNumber = startAtBlock - i;
      if (blockNumber >= 0) {
        newBlocks.push(this.getBlock(blockNumber));
      }
    }
    return Promise.all(newBlocks);
  }

  private async getTransaction(hash: string): Promise<Transaction> {
    const cachedTransaction = this.cachedTransactions.find(
      (_) => _.hash === hash
    );
    if (cachedTransaction) {
      return cachedTransaction;
    }
    console.log(LOG_PREFIX, "Retrieving tx", hash);
    const transaction = (await this.rpcClient.getRawTransaction(
      hash
    )) as Transaction;
    if (this.cachedTransactions.length === TRANSACTION_CACHE_SIZE) {
      this.cachedTransactions.shift();
    }
    this.cachedTransactions.push(transaction);
    console.log(JSON.stringify(transaction), transaction);
    return transaction;
  }

  private async onNewBlockAvailable(blockHeight: number) {
    if (this.viewState.startAtBlock >= 0) {
      await this.updateViewState({ blockHeight });
    } else {
      await this.updateViewState({
        blockHeight,
        blocks: await this.getBlocks(-1, blockHeight),
      });
    }
  }

  private async refreshLoop() {
    if (this.closed) {
      return;
    }
    try {
      const blockHeight = await this.rpcClient.getBlockCount();
      if (blockHeight > this.viewState.blockHeight) {
        console.log(LOG_PREFIX, "New block available", blockHeight);
        await this.onNewBlockAvailable(blockHeight);
      }
    } finally {
      setTimeout(() => this.refreshLoop(), REFRESH_INTERVAL_MS);
    }
  }
}
