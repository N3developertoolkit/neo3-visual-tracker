import * as bitset from "bitset";
import { BlockJson } from "@cityofzion/neon-core/lib/types";
import * as neonCore from "@cityofzion/neon-core";
import { TransactionJson } from "@cityofzion/neon-core/lib/tx";
import * as vscode from "vscode";

import AddressInfo from "../shared/addressInfo";

const BLOCK_CACHE_SIZE = 1024;
const BLOCKS_PER_QUERY = 100;
const LOG_PREFIX = "[BlockchainMonitor]";
const MAX_RETRIES = 3;
const REFRESH_INTERVAL_MS = 1000 * 2; // check for new blocks every 2 seconds
const TRANSACTION_CACHE_SIZE = 1024;
const SCRIPTHASH_GAS = "0x668e0c1f9d7b70a99dd9e06eadd4c784d641afbc";
const SCRIPTHASH_NEO = "0xde5f57d430d3dece511cf975a8d37848cb9e0525";
const SLEEP_ON_ERROR_MS = 500;

export default class BlockchainMonitor {
  onChange: vscode.Event<number>;

  private readonly onChangeEmitter: vscode.EventEmitter<number>;

  private cachedBlocks: BlockJson[];
  private cachedTransactions: TransactionJson[];
  private disposed: boolean;
  private getPopulatedBlocksSuccess: boolean;
  private lastKnownBlockHeight: number;
  private populatedBlocks: bitset.BitSet;
  private rpcId: number;
  private tryGetPopulatedBlocks: boolean;

  constructor(private readonly rpcClient: neonCore.rpc.RPCClient) {
    this.cachedBlocks = [];
    this.cachedTransactions = [];
    this.disposed = false;
    this.getPopulatedBlocksSuccess = false;
    this.lastKnownBlockHeight = 0;
    this.populatedBlocks = new bitset.default();
    this.rpcId = 0;
    this.tryGetPopulatedBlocks = true;

    this.onChangeEmitter = new vscode.EventEmitter<number>();
    this.onChange = this.onChangeEmitter.event;

    this.refreshLoop();
  }

  dispose() {
    this.disposed = true;
    this.onChangeEmitter.dispose();
  }

  async getAddress(address: string): Promise<AddressInfo> {
    let retry = 0;
    while (retry < MAX_RETRIES) {
      console.log(
        LOG_PREFIX,
        `Retrieving address ${address} (attempt ${retry++})`
      );
      try {
        return {
          address,
          neoBalance: await this.getBalance(address, SCRIPTHASH_NEO),
          gasBalance: await this.getBalance(address, SCRIPTHASH_GAS),
        };
      } catch (e) {
        console.warn(
          LOG_PREFIX,
          `Error retrieving address ${address} (${
            e.message || "Unknown error"
          })`
        );
        await this.sleepBetweenRetries();
      }
    }
    throw new Error("Could not get address");
  }

  async getBlock(indexOrHash: string | number): Promise<BlockJson> {
    const cachedBlock = this.cachedBlocks.find(
      (_) => _.index === indexOrHash || _.hash === indexOrHash
    );
    if (cachedBlock) {
      return cachedBlock;
    }
    let retry = 0;
    while (retry < MAX_RETRIES) {
      console.log(
        LOG_PREFIX,
        `Retrieving block ${indexOrHash} (attempt ${retry++})`
      );
      try {
        const block = await this.rpcClient.getBlock(indexOrHash, true);
        // never cache head block
        if (block.index < this.lastKnownBlockHeight - 1) {
          if (this.cachedBlocks.length === BLOCK_CACHE_SIZE) {
            this.cachedBlocks.shift();
          }
          this.cachedBlocks.push(block);
        }
        return block;
      } catch (e) {
        console.warn(
          LOG_PREFIX,
          `Error retrieving block ${indexOrHash}: ${
            e.message || "Unknown error"
          }`
        );
        await this.sleepBetweenRetries();
      }
    }
    throw new Error("Could not get block");
  }

  async getTransaction(hash: string): Promise<TransactionJson> {
    const cachedTransaction = this.cachedTransactions.find(
      (_) => _.hash === hash
    );
    if (cachedTransaction) {
      return cachedTransaction;
    }
    let retry = 0;
    while (retry < MAX_RETRIES) {
      console.log(LOG_PREFIX, `Retrieving tx ${hash} (attempt ${retry++})`);
      try {
        const transaction = await this.rpcClient.getRawTransaction(hash, true);
        if (this.cachedTransactions.length === TRANSACTION_CACHE_SIZE) {
          this.cachedTransactions.shift();
        }
        this.cachedTransactions.push(transaction);
        return transaction;
      } catch (e) {
        console.warn(
          LOG_PREFIX,
          `Error retrieving tx ${hash}: ${e.message || "Unknown error"}`
        );
        await this.sleepBetweenRetries();
      }
    }
    throw new Error("Could not get transaction");
  }

  isBlockPopulated(blockIndex: number) {
    return (
      !this.getPopulatedBlocksSuccess || this.populatedBlocks.get(blockIndex)
    );
  }

  isFilterAvailable() {
    return this.getPopulatedBlocksSuccess;
  }

  private async refreshLoop() {
    if (this.disposed) {
      return;
    }
    try {
      await this.updateState();
    } catch (e) {
      console.error(LOG_PREFIX, "Unexpected error", e.message);
    } finally {
      setTimeout(() => this.refreshLoop(), REFRESH_INTERVAL_MS);
    }
  }

  private async sleepBetweenRetries() {
    return new Promise((resolve) => setTimeout(resolve, SLEEP_ON_ERROR_MS));
  }

  private async updateState() {
    const blockHeight = await this.rpcClient.getBlockCount();
    let fireChangeEvent = blockHeight !== this.lastKnownBlockHeight;

    // TODO: More resilient way of detecting resets and checkpoint applications
    if (
      blockHeight !== this.lastKnownBlockHeight &&
      blockHeight !== this.lastKnownBlockHeight + 1
    ) {
      console.log(LOG_PREFIX, "Potential blockchain reset; clearing cache");
      this.populatedBlocks = new bitset.default();
      this.tryGetPopulatedBlocks = true;
      this.getPopulatedBlocksSuccess = false;
      this.lastKnownBlockHeight = 0;
      this.cachedBlocks = [];
      this.cachedTransactions = [];
    }

    if (this.tryGetPopulatedBlocks) {
      try {
        let start = blockHeight;
        while (start > this.lastKnownBlockHeight) {
          const count = Math.min(
            start - this.lastKnownBlockHeight,
            BLOCKS_PER_QUERY
          );
          const result = (await this.rpcClient.query({
            method: "expressgetpopulatedblocks",
            params: [count, start],
            id: this.rpcId++,
            jsonrpc: "2.0",
          })) as number[];
          if (!this.getPopulatedBlocksSuccess) {
            this.getPopulatedBlocksSuccess = true;
            fireChangeEvent = true;
          }
          for (const blockNumber of result) {
            if (!this.populatedBlocks.get(blockNumber)) {
              this.populatedBlocks.set(blockNumber);
              fireChangeEvent = true;
            }
          }
          start = result.length ? result[result.length - 1] : 0;
        }
      } catch (e) {
        if (e.message?.indexOf("Method not found") !== -1) {
          this.tryGetPopulatedBlocks = false;
        } else {
          throw e;
        }
      }
    }

    this.lastKnownBlockHeight = blockHeight;

    if (fireChangeEvent) {
      this.onChangeEmitter.fire(blockHeight);
    }
  }

  private async getBalance(address: string, assetScriptHash: string) {
    const result: any = await this.rpcClient.query({
      jsonrpc: "2.0",
      id: this.rpcId++,
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
}
