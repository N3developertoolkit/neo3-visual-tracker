import * as neonCore from "@cityofzion/neon-core";
import * as vscode from "vscode";
import { BlockJson } from "@cityofzion/neon-core/lib/types";
import { TransactionJson } from "@cityofzion/neon-core/lib/tx";

import AddressInfo from "../../shared/addressInfo";
import PanelControllerBase from "./panelControllerBase";
import TrackerViewRequest from "../../shared/messages/trackerViewRequest";
import TrackerViewState from "../../shared/viewState/trackerViewState";

const BLOCK_CACHE_SIZE = 1024;
const BLOCKS_PER_PAGE = 50;
const HISTORY_SIZE = 50;
const LOG_PREFIX = "[TrackerPanelController]";
const PAGINATION_DISTANCE = 5;
const REFRESH_INTERVAL_MS = 1000 * 2; // check for new blocks every 2 seconds
const SCRIPTHASH_GAS = "0x668e0c1f9d7b70a99dd9e06eadd4c784d641afbc";
const SCRIPTHASH_NEO = "0xde5f57d430d3dece511cf975a8d37848cb9e0525";
const SLEEP_ON_ERROR_MS = 1000 * 3;
const TRANSACTION_CACHE_SIZE = 1024;

export default class TrackerPanelController extends PanelControllerBase<
  TrackerViewState,
  TrackerViewRequest
> {
  private readonly blockchainId: Promise<string>;
  private readonly cachedBlocks: BlockJson[];
  private readonly cachedTransactions: TransactionJson[];
  private readonly rpcClient: neonCore.rpc.RPCClient;
  private readonly state: vscode.Memento;

  constructor(context: vscode.ExtensionContext, rpcUrl: string) {
    super(
      {
        view: "tracker",
        panelTitle: `Block Explorer: ${rpcUrl}`,
        blockHeight: 0,
        paginationDistance: PAGINATION_DISTANCE,
        blocks: [],
        selectedAddress: null,
        selectedTransaction: null,
        selectedBlock: null,
        startAtBlock: -1,
        searchHistory: [],
      },
      context
    );
    this.cachedBlocks = [];
    this.cachedTransactions = [];
    this.rpcClient = new neonCore.rpc.RPCClient(rpcUrl);
    this.state = context.workspaceState;
    this.blockchainId = this.getBlock(0, false).then((_) => _.hash);
    this.refreshLoop();
  }

  onClose() {}

  protected async onRequest(request: TrackerViewRequest) {
    if (request.search) {
      await this.resolveSearch(request);
    }
    if (request.selectAddress !== undefined) {
      if (request.selectAddress) {
        await this.updateViewState({
          selectedAddress: await this.getAddress(request.selectAddress),
          searchHistory: await this.getSearchHistory(),
        });
      } else {
        await this.updateViewState({
          selectedAddress: null,
          searchHistory: await this.getSearchHistory(),
        });
      }
    }
    if (request.setStartAtBlock !== undefined) {
      await this.updateViewState({
        startAtBlock: request.setStartAtBlock,
        blocks: await this.getBlocks(
          request.setStartAtBlock,
          this.viewState.blockHeight
        ),
        searchHistory: await this.getSearchHistory(),
      });
    }
    if (request.selectBlock !== undefined) {
      if (request.selectBlock) {
        const selectedBlock = await this.getBlock(request.selectBlock, true);
        await this.updateViewState({
          selectedBlock,
          selectedTransaction: null,
          searchHistory: await this.getSearchHistory(),
        });
      } else {
        await this.updateViewState({
          selectedBlock: null,
          selectedTransaction: null,
          searchHistory: await this.getSearchHistory(),
        });
      }
    }
    if (request.selectTransaction !== undefined) {
      if (request.selectTransaction) {
        const selectedTransaction = await this.getTransaction(
          request.selectTransaction
        );
        const selectedBlock = await this.getBlock(
          (selectedTransaction as any).blockhash,
          false
        );
        await this.updateViewState({
          selectedTransaction,
          selectedBlock,
          searchHistory: await this.getSearchHistory(),
        });
      } else {
        await this.updateViewState({
          selectedTransaction: null,
          searchHistory: await this.getSearchHistory(),
        });
      }
    }
  }

  private async addToSearchHistory(query: string) {
    let history = await this.getSearchHistory();
    history = [query, ...history.filter((_) => _ !== query)];
    history.length = Math.min(HISTORY_SIZE, history.length);
    await this.state.update(`history_${await this.blockchainId}`, history);
  }

  private async getAddress(address: string): Promise<AddressInfo> {
    let retry = 0;
    while (true) {
      console.log(
        LOG_PREFIX,
        "Retrieving address",
        address,
        "- attempt",
        retry + 1
      );
      try {
        const result = {
          address,
          neoBalance: await this.getBalance(address, SCRIPTHASH_NEO),
          gasBalance: await this.getBalance(address, SCRIPTHASH_GAS),
        };
        await this.addToSearchHistory(address);
        return result;
      } catch (e) {
        console.warn(
          LOG_PREFIX,
          "Error retrieving address",
          address,
          e.message
        );
        await this.sleepBetweenRetries();
      }
    }
  }

  private async getBalance(address: string, assetScriptHash: string) {
    const result: any = await this.rpcClient.query({
      jsonrpc: "2.0",
      id: 1,
      method: "invokefunction",
      params: [
        assetScriptHash,
        "balanceOf",
        [
          {
            type: "Hash160",
            value: neonCore.wallet.getScriptHashFromAddress(address),
          },
        ],
      ],
    });
    return parseInt((result.stack || [])[0]?.value || "0");
  }

  private async getBlock(
    indexOrHash: string | number,
    addToHistory: boolean
  ): Promise<BlockJson> {
    const cachedBlock = this.cachedBlocks.find(
      (_) => _.index === indexOrHash || _.hash === indexOrHash
    );
    if (cachedBlock) {
      if (addToHistory) {
        this.addToSearchHistory(cachedBlock.index + "");
      }
      return cachedBlock;
    }
    let retry = 0;
    while (true) {
      console.log(
        LOG_PREFIX,
        "Retrieving block",
        indexOrHash,
        "- attempt",
        retry++
      );
      try {
        const block = await this.rpcClient.getBlock(indexOrHash, true);
        // never cache head block
        if (block.index < this.viewState.blockHeight - 1) {
          if (this.cachedBlocks.length === BLOCK_CACHE_SIZE) {
            this.cachedBlocks.shift();
          }
          this.cachedBlocks.push(block);
        }
        if (addToHistory) {
          this.addToSearchHistory(block.index + "");
        }
        return block;
      } catch (e) {
        console.warn(
          LOG_PREFIX,
          "Error retrieving block",
          indexOrHash,
          e.message
        );
        await this.sleepBetweenRetries();
      }
    }
  }

  private async getBlocks(startAtBlock: number, blockHeight: number) {
    let newBlocks: Promise<BlockJson>[] = [];
    startAtBlock =
      startAtBlock < 0 || startAtBlock >= blockHeight
        ? blockHeight - 1
        : startAtBlock;
    for (let i = 0; i < BLOCKS_PER_PAGE; i++) {
      const blockNumber = startAtBlock - i;
      if (blockNumber >= 0) {
        newBlocks.push(this.getBlock(blockNumber, false));
      }
    }
    return Promise.all(newBlocks);
  }

  private async getSearchHistory(): Promise<string[]> {
    return this.state.get<string[]>(`history_${await this.blockchainId}`, []);
  }

  private async getTransaction(hash: string): Promise<TransactionJson> {
    const cachedTransaction = this.cachedTransactions.find(
      (_) => _.hash === hash
    );
    if (cachedTransaction) {
      this.addToSearchHistory(hash);
      return cachedTransaction;
    }
    let retry = 0;
    while (true) {
      console.log(LOG_PREFIX, "Retrieving tx", hash, "- attempt", retry + 1);
      try {
        const transaction = await this.rpcClient.getRawTransaction(hash, true);
        if (this.cachedTransactions.length === TRANSACTION_CACHE_SIZE) {
          this.cachedTransactions.shift();
        }
        this.cachedTransactions.push(transaction);
        this.addToSearchHistory(hash);
        return transaction;
      } catch (e) {
        console.warn(LOG_PREFIX, "Error retrieving tx", hash, e.message);
        await this.sleepBetweenRetries();
      }
    }
  }

  private async onNewBlockAvailable(blockHeight: number) {
    if (this.viewState.startAtBlock >= 0) {
      await this.updateViewState({
        blockHeight,
        searchHistory: await this.getSearchHistory(),
      });
    } else {
      await this.updateViewState({
        blockHeight,
        blocks: await this.getBlocks(-1, blockHeight),
        searchHistory: await this.getSearchHistory(),
      });
    }
  }

  private async refreshLoop() {
    if (this.isClosed) {
      return;
    }
    try {
      const blockHeight = await this.rpcClient.getBlockCount();
      if (Math.abs(blockHeight - this.viewState.blockHeight) > 1) {
        console.log(LOG_PREFIX, "Potential reset detected", blockHeight);
        this.cachedBlocks.length = 0;
        this.cachedTransactions.length = 0;
        await this.onNewBlockAvailable(blockHeight);
      } else if (blockHeight > this.viewState.blockHeight) {
        console.log(LOG_PREFIX, "New block available", blockHeight);
        await this.onNewBlockAvailable(blockHeight);
      }
    } finally {
      setTimeout(() => this.refreshLoop(), REFRESH_INTERVAL_MS);
    }
  }

  private async resolveSearch(request: TrackerViewRequest) {
    const query = (request.search || "").trim();
    if (parseInt(query) + "" === query) {
      try {
        const block = await this.getBlock(parseInt(query), false);
        request.selectBlock = block.hash;
        return;
      } catch {
        return;
      }
    }
    try {
      const block = await this.getBlock(query, false);
      request.selectBlock = block.hash;
      return;
    } catch {
      try {
        const tx = await this.getTransaction(query.toLowerCase());
        request.selectTransaction = tx.hash;
        return;
      } catch {
        try {
          await this.getAddress(query);
          request.selectAddress = query;
          return;
        } catch {}
      }
    }
  }

  private async sleepBetweenRetries() {
    return new Promise((resolve) => setTimeout(resolve, SLEEP_ON_ERROR_MS));
  }
}
