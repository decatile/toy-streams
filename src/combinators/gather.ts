import { AsyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";

export class GatherIterableStream<T> extends AsyncStream<T> {
  #it;

  constructor(it: Iterator<Promise<T>> | AsyncIterator<Promise<T>>) {
    super();
    this.#it = it;
  }

  async nextItem(): Promise<StreamItem<T>> {
    try {
      const { done, value } = await this.#it.next();
      if (done) return Items.done;
      return Items.item(await value);
    } catch (e) {
      return Items.error(e);
    }
  }
}
