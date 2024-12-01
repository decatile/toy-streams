import { SyncStream, AsyncStream } from "../base";
import { Promising, StreamItem } from "../types";
import { Items, STREAM_CANCEL_SIGNAL } from "../utils";

export class SyncIterateStream<T, A> extends SyncStream<T> {
  #fn;
  #init;

  constructor(fn: (a: A) => [T, A], init: A) {
    super();
    this.#fn = fn;
    this.#init = init;
  }

  nextItem(): StreamItem<T> {
    try {
      const [result, newInit] = this.#fn(this.#init);
      this.#init = newInit;
      return Items.item(result);
    } catch (e) {
      if (e === STREAM_CANCEL_SIGNAL) return Items.done;
      return Items.error(e);
    }
  }
}

export class AsyncIterateStream<T, A> extends AsyncStream<T> {
  #fn;
  #init;

  constructor(fn: (a: A) => Promising<[T, A]>, init: A) {
    super();
    this.#fn = fn;
    this.#init = init;
  }

  async nextItem(): Promise<StreamItem<T>> {
    try {
      const [result, newInit] = await this.#fn(this.#init);
      this.#init = newInit;
      return Items.item(result);
    } catch (e) {
      if (e === STREAM_CANCEL_SIGNAL) return Items.done;
      return Items.error(e);
    }
  }
}
