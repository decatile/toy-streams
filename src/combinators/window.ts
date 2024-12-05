import { AsyncStream, SyncStream } from "../base";
import { StreamItem, WindowStreamKind } from "../types";
import { Items } from "../utils";

export class SyncWindowStream<T> extends SyncStream<T> {
  #stream;
  #value;
  #next;

  constructor(stream: SyncStream<T>, kind: WindowStreamKind, value: number) {
    super();
    this.#stream = stream;
    this.#value = value;
    this.#next = (kind === "take" ? this.#take : this.#skip).bind(this);
  }

  #take() {
    if (!this.#value) return Items.done;
    const item = this.#stream.nextItem();
    if (!("done" in item)) this.#value--;
    return item;
  }

  #skip() {
    while (this.#value) {
      const item = this.#stream.nextItem();
      if ("done" in item) return item;
      this.#value--;
    }
    return this.#stream.nextItem();
  }

  nextItem(): StreamItem<T> {
    return this.#next() as StreamItem<T>;
  }
}

export class AsyncWindowStream<T> extends AsyncStream<T> {
  #stream;
  #value;
  #next;

  constructor(stream: AsyncStream<T>, kind: WindowStreamKind, value: number) {
    super();
    this.#stream = stream;
    this.#value = value;
    this.#next = (kind === "take" ? this.#take : this.#skip).bind(this);
  }

  async #take() {
    if (!this.#value) return Items.done;
    const item = await this.#stream.nextItem();
    if (!("done" in item)) this.#value--;
    return item;
  }

  async #skip() {
    while (this.#value) {
      const item = await this.#stream.nextItem();
      if ("done" in item) return item;
      this.#value--;
    }
    return this.#stream.nextItem();
  }

  async nextItem(): Promise<StreamItem<T>> {
    return this.#next() as Promise<StreamItem<T>>;
  }
}
