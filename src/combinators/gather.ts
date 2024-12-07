import { AsyncStream } from "../base";
import { StreamItem } from "../types";
import { Item } from "../utils";

export class GatherIterableStream<T> extends AsyncStream<T> {
  #it;

  constructor(it: Iterator<Promise<T>> | AsyncIterator<Promise<T>>) {
    super();
    this.#it = it;
  }

  async nextItem(): Promise<StreamItem<T>> {
    try {
      const { done, value } = await this.#it.next();
      if (done??false) return Item.done;
      return Item.value(await value);
    } catch (e) {
      return Item.error(e);
    }
  }
}
