import { AsyncStream, SyncStream } from "../base";
import { Promising, StreamItem } from "../types";
import { Item } from "../utils";

export class SyncMapStream<T, T1> extends SyncStream<T1> {
  #stream;
  #fn;

  constructor(stream: SyncStream<T>, fn: (a: T) => T1) {
    super();
    this.#stream = stream;
    this.#fn = fn;
  }

  nextItem(): StreamItem<T1> {
    const item = this.#stream.nextItem();
    if (!("value" in item)) return item;
    try {
      return Item.value(this.#fn(item.value));
    } catch (e) {
      return Item.wrapError(e)
    }
  }
}

export class AsyncMapStream<T, T1> extends AsyncStream<T1> {
  #stream;
  #fn;

  constructor(stream: AsyncStream<T>, fn: (a: T) => Promising<T1>) {
    super();
    this.#stream = stream;
    this.#fn = fn;
  }

  async nextItem(): Promise<StreamItem<T1>> {
    const item = await this.#stream.nextItem();
    if (!("value" in item)) return item;
    try {
      return Item.value(await this.#fn(item.value));
    } catch (e) {
      return Item.wrapError(e)
    }
  }
}
