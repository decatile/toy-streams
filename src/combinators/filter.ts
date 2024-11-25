import { AsyncStream, SyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";

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
      return Items.error(e);
    }
    throw Error("Impossible");
  }
}

export class AsyncFilterStream<T> extends AsyncStream<T> {
  #stream;
  #fn;

  constructor(
    stream: AsyncStream<T>,
    fn: (a: T) => boolean | Promise<boolean>
  ) {
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
      return Items.error(e);
    }
    throw Error("Impossible");
  }
}
