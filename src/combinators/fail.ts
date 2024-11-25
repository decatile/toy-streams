import { SyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";

export class SyncFailStream<T> extends SyncStream<T> {
  #error;

  constructor(error: unknown) {
    super();
    this.#error = error;
  }

  nextItem(): StreamItem<T> {
    return Items.error(this.#error);
  }
}
