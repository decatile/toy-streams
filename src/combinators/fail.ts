import { SyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";

export class SyncFailStream<T> extends SyncStream<T> {
  #it;

  constructor(it: Iterator<unknown>) {
    super();
    this.#it = it;
  }

  nextItem(): StreamItem<T> {
    try {
      const item = this.#it.next();
      if (item.done) return Items.done;
      return Items.error(item.value);
    } catch (e) {
      return Items.error(e);
    }
  }
}
