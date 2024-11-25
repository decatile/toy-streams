import { SyncStream, AsyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";

export class SyncExtendStream<T> extends SyncStream<T> {
  #streams: SyncStream<T>[];
  #index: number = 0;

  constructor(s1: SyncStream<T>, s2: SyncStream<T>) {
    super();
    this.#streams = [s1, s2];
  }

  nextItem(): StreamItem<T> {
    while (1) {
      const current = this.#streams[this.#index];
      if (!current) return Items.done;
      const item = current.nextItem();
      if (!("d" in item)) return item;
      this.#index++;
    }
    throw Error("Impossible");
  }
}

export class AsyncExtendStream<T> extends AsyncStream<T> {
  #streams: AsyncStream<T>[];
  #index: number = 0;

  constructor(s1: AsyncStream<T>, s2: AsyncStream<T>) {
    super();
    this.#streams = [s1, s2];
  }

  async nextItem(): Promise<StreamItem<T>> {
    while (1) {
      const current = this.#streams[this.#index];
      if (!current) return Items.done;
      const item = await current.nextItem();
      if (!("d" in item)) return item;
      this.#index++;
    }
    throw Error("Impossible");
  }
}
