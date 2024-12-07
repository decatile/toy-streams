import { SyncStream, AsyncStream } from "../base";
import { StreamItem } from "../types";
import { Item } from "../utils";

export class SyncMeasureStream<T> extends SyncStream<[T, number]> {
  #stream;

  constructor(stream: SyncStream<T>) {
    super();
    this.#stream = stream;
  }

  nextItem(): StreamItem<[T, number]> {
    const from = performance.now();
    const item = this.#stream.nextItem();
    if (!("value" in item)) return item;
    return Item.value([item.value, performance.now() - from]);
  }
}

export class AsyncMeasureStream<T> extends AsyncStream<[T, number]> {
  #stream;

  constructor(stream: AsyncStream<T>) {
    super();
    this.#stream = stream;
  }

  async nextItem(): Promise<StreamItem<[T, number]>> {
    const from = performance.now();
    const item = await this.#stream.nextItem();
    if (!("value" in item)) return item;
    return Item.value([item.value, performance.now() - from]);
  }
}
