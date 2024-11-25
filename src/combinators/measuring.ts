import { SyncStream, AsyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";

export class SyncMeasuringStream<T> extends SyncStream<[T, number]> {
  #stream;

  constructor(stream: SyncStream<T>) {
    super();
    this.#stream = stream;
  }

  nextItem(): StreamItem<[T, number]> {
    const from = performance.now();
    const item = this.#stream.nextItem();
    if (!("value" in item)) return item;
    return Items.item([item.value, performance.now() - from]);
  }
}

export class AsyncMeasuredStream<T> extends AsyncStream<[T, number]> {
  #stream;

  constructor(stream: AsyncStream<T>) {
    super();
    this.#stream = stream;
  }

  async nextItem(): Promise<StreamItem<[T, number]>> {
    const from = performance.now();
    const item = await this.#stream.nextItem();
    if (!("value" in item)) return item;
    return Items.item([item.value, performance.now() - from]);
  }
}
