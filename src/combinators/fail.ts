import { SyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";

export class SyncFailStream<T> extends SyncStream<T> {
  #errors;

  constructor(...errors: unknown[]) {
    super();
    this.#errors = errors[Symbol.iterator]();
  }

  nextItem(): StreamItem<T> {
    const item = this.#errors.next();
    if (item.done) return Items.done;
    return Items.error(item.value);
  }
}
