import * as neonCore from "@cityofzion/neon-core";
import * as vscode from "vscode";
import { BlockJson } from "@cityofzion/neon-core/lib/types";
import { TransactionJson } from "@cityofzion/neon-core/lib/tx";

import AddressInfo from "../../shared/addressInfo";
import AutoComplete from "../autoComplete";
import BlockchainMonitor from "../blockchainMonitor";
import PanelControllerBase from "./panelControllerBase";
import TrackerViewRequest from "../../shared/messages/trackerViewRequest";
import TrackerViewState from "../../shared/viewState/trackerViewState";

const BLOCKS_PER_PAGE = 50;
const HISTORY_SIZE = 50;
const LOG_PREFIX = "[TrackerPanelController]";
const PAGINATION_DISTANCE = 5;

export default class TrackerPanelController extends PanelControllerBase<
  TrackerViewState,
  TrackerViewRequest
> {
  private readonly blockchainId: Promise<string>;
  private readonly blockchainMonitor: BlockchainMonitor;
  private readonly rpcClient: neonCore.rpc.RPCClient;
  private readonly state: vscode.Memento;

  constructor(
    context: vscode.ExtensionContext,
    rpcUrl: string,
    autoComplete: AutoComplete
  ) {
    super(
      {
        view: "tracker",
        panelTitle: `Block Explorer: ${rpcUrl}`,
        autoCompleteData: autoComplete.data,
        blockHeight: 0,
        blocks: [],
        paginationDistance: PAGINATION_DISTANCE,
        populatedBlocksFilterEnabled: false,
        populatedBlocksFilterSupported: false,
        searchHistory: [],
        selectedAddress: null,
        selectedTransaction: null,
        selectedBlock: null,
        startAtBlock: -1,
      },
      context
    );
    this.state = context.workspaceState;
    this.rpcClient = new neonCore.rpc.RPCClient(rpcUrl);
    this.blockchainMonitor = new BlockchainMonitor(
      `trackerPanel:${rpcUrl}`,
      this.rpcClient
    );
    this.blockchainId = new Promise(async (resolve) => {
      let genesisBlock: BlockJson | null = null;
      while (!genesisBlock) {
        genesisBlock = await this.blockchainMonitor.getBlock(0);
      }
      resolve(genesisBlock.hash);
    });
    this.blockchainMonitor.onChange(this.onBlockchainChange.bind(this));
    autoComplete.onChange((autoCompleteData) =>
      this.updateViewState({ autoCompleteData })
    );
  }

  onClose() {
    this.blockchainMonitor.dispose();
  }

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

    if (request.selectBlock !== undefined) {
      if (request.selectBlock) {
        const selectedBlock = await this.blockchainMonitor.getBlock(
          request.selectBlock
        );
        if (selectedBlock) {
          await this.addToSearchHistory(`${selectedBlock.index}`);
          await this.updateViewState({
            selectedBlock,
            selectedTransaction: null,
            searchHistory: await this.getSearchHistory(),
          });
        }
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
        const selectedBlock = await this.blockchainMonitor.getBlock(
          (selectedTransaction as any).blockhash
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

    if (request.togglePopulatedBlockFilter !== undefined) {
      await this.updateViewState({
        populatedBlocksFilterEnabled:
          request.togglePopulatedBlockFilter.enabled,
      });
      await this.onBlockchainChange(this.viewState.blockHeight);
    }
  }

  private async addToSearchHistory(query: string) {
    let history = await this.getSearchHistory();
    history = [query, ...history.filter((_) => _ !== query)];
    history.length = Math.min(HISTORY_SIZE, history.length);
    await this.state.update(`history_${await this.blockchainId}`, history);
  }

  private async getAddress(
    address: string,
    retryOnFailure: boolean = true
  ): Promise<AddressInfo> {
    const result = await this.blockchainMonitor.getAddress(
      address,
      retryOnFailure
    );
    await this.addToSearchHistory(address);
    return result;
  }

  private async getBlocks(startAtBlock: number, blockHeight: number) {
    let newBlocks: Promise<BlockJson | null>[] = [];
    let blockNumber =
      startAtBlock < 0 || startAtBlock >= blockHeight
        ? blockHeight - 1
        : startAtBlock;
    while (newBlocks.length < BLOCKS_PER_PAGE && blockNumber >= 0) {
      if (
        !this.viewState.populatedBlocksFilterEnabled ||
        !this.viewState.populatedBlocksFilterSupported ||
        this.blockchainMonitor.isBlockPopulated(blockNumber)
      ) {
        newBlocks.push(this.blockchainMonitor.getBlock(blockNumber));
      }
      blockNumber--;
    }
    return Promise.all(newBlocks);
  }

  private async getSearchHistory(): Promise<string[]> {
    return this.state.get<string[]>(`history_${await this.blockchainId}`, []);
  }

  private async getTransaction(
    hash: string,
    retryOnFailure: boolean = true
  ): Promise<TransactionJson> {
    const tx = await this.blockchainMonitor.getTransaction(
      hash,
      retryOnFailure
    );
    await this.addToSearchHistory(hash);
    return tx;
  }

  private async onBlockchainChange(blockHeight: number) {
    try {
      if (this.viewState.startAtBlock >= 0) {
        await this.updateViewState({
          blockHeight,
          blocks: await this.getBlocks(
            this.viewState.startAtBlock,
            blockHeight
          ),
          populatedBlocksFilterSupported: this.blockchainMonitor.isFilterAvailable(),
          searchHistory: await this.getSearchHistory(),
        });
      } else {
        await this.updateViewState({
          blockHeight,
          blocks: await this.getBlocks(-1, blockHeight),
          populatedBlocksFilterSupported: this.blockchainMonitor.isFilterAvailable(),
          searchHistory: await this.getSearchHistory(),
        });
      }
    } catch (e) {
      console.error(
        LOG_PREFIX,
        "Unexpected error processing blockchain update",
        blockHeight,
        e.message
      );
    }
  }

  private async resolveSearch(request: TrackerViewRequest) {
    const query = (request.search || "").trim();

    if (parseInt(query) + "" === query) {
      try {
        const block = await this.blockchainMonitor.getBlock(parseInt(query));
        if (block) {
          request.selectBlock = block.hash;
        }
      } catch {
        await vscode.window.showErrorMessage(
          `Could not retrieve block ${parseInt(query)}`
        );
      }
      return;
    }

    if (query.startsWith("N")) {
      try {
        await this.getAddress(query, false);
        request.selectAddress = query;
      } catch {
        await vscode.window.showErrorMessage(
          `Could not retrieve address ${query}`
        );
      }
      return;
    }

    try {
      const block = await this.blockchainMonitor.getBlock(query, false);
      if (block) {
        request.selectBlock = block.hash;
      }
    } catch {
      try {
        const tx = await this.getTransaction(query.toLowerCase(), false);
        request.selectTransaction = tx.hash;
      } catch {
        await vscode.window.showErrorMessage(
          `Could not retrieve block or transaction with hash ${query}`
        );
      }
    }
  }
}
