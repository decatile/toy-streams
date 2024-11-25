import { AsyncStream } from "../base";
import { StreamItem } from "../types";

export class AsyncDelayedStream<T> extends AsyncStream<T> {
    #stream;
    #ms;
  
    constructor(stream: AsyncStream<T>, ms: number) {
      super();
      this.#stream = stream;
      this.#ms = ms;
    }
  
    async nextItem(): Promise<StreamItem<T>> {
      await new Promise((r) => setTimeout(r, this.#ms));
      return this.#stream.nextItem();
    }
  }