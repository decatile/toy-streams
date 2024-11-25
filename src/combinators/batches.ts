import { SyncStream, AsyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";

export class SyncBatchesStream<T> extends SyncStream<T[]> {
  #storage: T[] = [];
  #done = false;
  #stream;
  #count;

  constructor(stream: SyncStream<T>, count: number) {
    super();
    this.#stream = stream;
    this.#count = count;
  }

  #swap() {
    const r = this.#storage;
    this.#storage = [];
    return r;
  }

  nextItem(): StreamItem<T[]> {
    if (this.#done) return Items.done;
    while (this.#storage.length < this.#count) {
      const item = this.#stream.nextItem();
      if ("done" in item) {
        this.#done = true;
        return Items.item(this.#swap());
      }
      if ("error" in item) return item;
      this.#storage.push(item.value);
    }
    return Items.item(this.#swap());
  }
}

export class AsyncBatchesStream<T> extends AsyncStream<T[]> {
  #storage: T[] = [];
  #done = false;
  #stream;
  #count;

  constructor(stream: AsyncStream<T>, count: number) {
    super();
    this.#stream = stream;
    this.#count = count;
  }

  #swap() {
    const r = this.#storage;
    this.#storage = [];
    return r;
  }

  async nextItem(): Promise<StreamItem<T[]>> {
    if (this.#done) return Items.done;
    while (this.#storage.length < this.#count) {
      const item = await this.#stream.nextItem();
      if ("done" in item) {
        this.#done = true;
        return Items.item(this.#swap());
      }
      if ("error" in item) return item;
      this.#storage.push(item.value);
    }
    return Items.item(this.#swap());
  }
}
