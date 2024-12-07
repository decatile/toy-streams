import { AsyncStream, SyncStream } from "../base";
import { Promising, StreamItem } from "../types";
import { Item, STREAM_CANCEL_SIGNAL } from "../utils";

export class SyncFilterStream<T> extends SyncStream<T> {
  #stream;
  #fn;

  constructor(stream: SyncStream<T>, fn: (a: T) => boolean) {
    super();
    this.#stream = stream;
    this.#fn = fn;
  }

  nextItem(): StreamItem<T> {
    try {
      while (1) {
        const item = this.#stream.nextItem();
        if (!("value" in item) || this.#fn(item.value)) return item;
      }
    } catch (e) {
      return Item.wrapError(e)
    }
    throw Error("Impossible");
  }
}

export class AsyncFilterStream<T> extends AsyncStream<T> {
  #stream;
  #fn;

  constructor(stream: AsyncStream<T>, fn: (a: T) => Promising<boolean>) {
    super();
    this.#stream = stream;
    this.#fn = fn;
  }

  async nextItem(): Promise<StreamItem<T>> {
    try {
      while (1) {
        const item = await this.#stream.nextItem();
        if (!("value" in item) || (await this.#fn(item.value))) return item;
      }
    } catch (e) {
      if (e == STREAM_CANCEL_SIGNAL) return Item.done;
      return Item.error(e);
    }
    throw Error("Impossible");
  }
}
