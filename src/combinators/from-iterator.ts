import { AsyncStream, SyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";

export class SyncIterableStream<T> extends SyncStream<T> {
  #it;

  constructor(it: Iterator<T>) {
    super();
    this.#it = it;
  }

  nextItem(): StreamItem<T> {
    try {
      return Items.from(this.#it.next());
    } catch (e) {
      return Items.error(e);
    }
  }
}

export class AsyncIterableStream<T> extends AsyncStream<T> {
  #it;

  constructor(it: AsyncIterator<T>) {
    super();
    this.#it = it;
  }

  async nextItem(): Promise<StreamItem<T>> {
    try {
      return Items.from(await this.#it.next());
    } catch (e) {
      return Items.error(e);
    }
  }
}
