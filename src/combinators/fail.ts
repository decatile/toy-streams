import { SyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";

export class SyncFailStream<T> extends SyncStream<T> {
  #error;
  #done = false;

  constructor(error: unknown) {
    super();
    this.#error = error;
  }

  nextItem(): StreamItem<T> {
    if (this.#done) return Items.done;
    this.#done = true;
    return Items.error(this.#error);
  }
}
