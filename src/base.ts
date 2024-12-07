import { StreamItem } from "./types";
import { Item } from "./utils";

export abstract class SyncStream<T> implements Iterable<T>, Iterator<T> {
  get sync() {
    return true as const;
  }

  [Symbol.iterator]() {
    return this;
  }

  next(): IteratorResult<T> {
    return Item.into(this.nextItem());
  }

  abstract nextItem(): StreamItem<T>;
}

export abstract class AsyncStream<T>
  implements AsyncIterable<T>, AsyncIterator<T>
{
  get sync() {
    return false as const;
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  async next(): Promise<IteratorResult<T>> {
    return Item.into(await this.nextItem());
  }

  abstract nextItem(): Promise<StreamItem<T>>;
}
