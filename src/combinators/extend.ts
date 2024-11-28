import { SyncStream, AsyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";
import { SyncIntoAsyncStreamAdapter } from "./sync-as-async";

export class SyncExtendStream<T> extends SyncStream<T> {
  #streams: SyncStream<T>[];
  #index: number = 0;

  constructor(...streams: SyncStream<T>[]) {
    super();
    this.#streams = streams;
  }

  nextItem(): StreamItem<T> {
    while (1) {
      const current = this.#streams[this.#index];
      if (!current) return Items.done;
      const item = current.nextItem();
      if (!("done" in item)) return item;
      this.#index++;
    }
    throw Error("Impossible");
  }
}

export class AsyncExtendStream<T> extends AsyncStream<T> {
  #streams: AsyncStream<T>[];
  #index: number = 0;

  constructor(...streams: AsyncStream<T>[]) {
    super();
    this.#streams = streams;
  }

  async nextItem(): Promise<StreamItem<T>> {
    while (1) {
      const current = this.#streams[this.#index];
      if (!current) return Items.done;
      const item = await current.nextItem();
      if (!("done" in item)) return item;
      this.#index++;
    }
    throw Error("Impossible");
  }
}
