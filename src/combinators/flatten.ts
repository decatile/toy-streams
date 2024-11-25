import { SyncStream, AsyncStream } from "../base";
import { StreamItem } from "../types";

export class SyncFlattenStream<T> extends SyncStream<T> {
    #current: SyncStream<T> | null = null;
    #stream;
  
    constructor(stream: SyncStream<SyncStream<T>>) {
      super();
      this.#stream = stream;
    }
  
    nextItem(): StreamItem<T> {
      while (1) {
        if (!this.#current) {
          const item = this.#stream.nextItem();
          if (!("i" in item)) return item;
          this.#current = item.i;
        }
        const item = this.#current!.nextItem();
        if (!("d" in item)) return item;
        this.#current = null;
      }
      throw Error("Impossible");
    }
  }
  
export   class AsyncFlattenStream<T> extends AsyncStream<T> {
    #current: AsyncStream<T> | null = null;
    #stream;
  
    constructor(stream: AsyncStream<SyncStream<T> | AsyncStream<T>>) {
      super();
      this.#stream = stream;
    }
  
    async nextItem(): Promise<StreamItem<T>> {
      while (1) {
        if (!this.#current) {
          const item = await this.#stream.nextItem();
          if (!("i" in item)) return item;
          this.#current = item.i.sync ? item.i.intoAsync() : item.i;
        }
        const item = await this.#current!.nextItem();
        if (!("d" in item)) return item;
        this.#current = null;
      }
      throw Error("Impossible");
    }
  }