import * as bitset from "bitset";
import * as neonCore from "@cityofzion/neon-core";

const LOG_PREFIX = "[EmptyBlockTracker]";
const BLOCKS_PER_QUERY = 100;
const REFRESH_INTERVAL_MS = 1000 * 5; // check for new blocks every 5 seconds

export default class EmptyBlockTracker {
  private disposed: boolean;
  private lastKnownBlockHeight: number;
  private populatedBlocks: bitset.BitSet;
  private rpcId: number;

  constructor(private readonly rpcClient: neonCore.rpc.RPCClient) {
    this.disposed = false;
    this.lastKnownBlockHeight = 0;
    this.populatedBlocks = new bitset.default();
    this.rpcId = 0;
    this.refreshLoop();
  }

  dispose() {
    this.disposed = true;
  }

  private async refreshLoop() {
    if (this.disposed) {
      return;
    }
    try {
      await this.updateState();
    } finally {
      setTimeout(() => this.refreshLoop(), REFRESH_INTERVAL_MS);
    }
  }

  private async updateState() {
    try {
      const blockHeight = await this.rpcClient.getBlockCount();
      if (
        blockHeight !== this.lastKnownBlockHeight &&
        blockHeight !== this.lastKnownBlockHeight + 1
      ) {
        console.log(LOG_PREFIX, "Potential blockchain reset; clearing cache");
        this.populatedBlocks = new bitset.default();
      }

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
        for (const blockNumber of result) {
          this.populatedBlocks.set(blockNumber);
        }
        start = result.length ? result[result.length - 1] : 0;
      }

      this.lastKnownBlockHeight = blockHeight;
    } catch (e) {
      // TODO: Handle non- neo-express endpoints
      console.error(LOG_PREFIX, "Could not get empty blocks", e.message);
    }
  }
}
