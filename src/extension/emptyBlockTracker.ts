import * as bitset from "bitset";
import * as neonCore from "@cityofzion/neon-core";

const LOG_PREFIX = "[EmptyBlockTracker]";
const BLOCKS_PER_QUERY = 100;
const REFRESH_INTERVAL_MS = 1000 * 5; // check for new blocks every 5 seconds

export default class EmptyBlockTracker {
  private disposed: boolean;
  private getPopulatedBlocksSuccess: boolean;
  private lastKnownBlockHeight: number;
  private populatedBlocks: bitset.BitSet;
  private rpcId: number;
  private tryGetPopulatedBlocks: boolean;

  constructor(private readonly rpcClient: neonCore.rpc.RPCClient) {
    this.disposed = false;
    this.getPopulatedBlocksSuccess = false;
    this.lastKnownBlockHeight = 0;
    this.populatedBlocks = new bitset.default();
    this.rpcId = 0;
    this.tryGetPopulatedBlocks = true;
    this.refreshLoop();
  }

  dispose() {
    this.disposed = true;
  }

  isFilterAvailable() {
    return this.getPopulatedBlocksSuccess;
  }

  isPopulated(blockIndex: number) {
    return (
      !this.getPopulatedBlocksSuccess || this.populatedBlocks.get(blockIndex)
    );
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

  private async updateState() {
    const blockHeight = await this.rpcClient.getBlockCount();
    if (
      blockHeight !== this.lastKnownBlockHeight &&
      blockHeight !== this.lastKnownBlockHeight + 1
    ) {
      console.log(LOG_PREFIX, "Potential blockchain reset; clearing cache");
      this.populatedBlocks = new bitset.default();
      this.tryGetPopulatedBlocks = true;
      this.getPopulatedBlocksSuccess = false;
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
          this.getPopulatedBlocksSuccess = true;
          for (const blockNumber of result) {
            this.populatedBlocks.set(blockNumber);
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
  }
}
