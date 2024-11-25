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
          if (!("value" in item)) return item;
          this.#current = item.value;
        }
        const item = this.#current!.nextItem();
        if (!("done" in item)) return item;
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
          if (!("value" in item)) return item;
          this.#current = item.value.sync ? item.value.async() : item.value;
        }
        const item = await this.#current!.nextItem();
        if (!("done" in item)) return item;
        this.#current = null;
      }
      throw Error("Impossible");
    }
  }