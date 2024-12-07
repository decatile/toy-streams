import { SyncStream } from "../base";
import { StreamItem } from "../types";
import { Item } from "../utils";

export class SyncFailStream<T> extends SyncStream<T> {
  #it;

  constructor(it: Iterator<unknown>) {
    super();
    this.#it = it;
  }

  nextItem(): StreamItem<T> {
    try {
      const item = this.#it.next();
      if (item.done??false) return Item.done;
      return Item.error(item.value);
    } catch (e) {
      return Item.error(e);
    }
  }
}
