import { AsyncStream, SyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";

export class SyncWindowStream<T> extends SyncStream<T> {
  #stream;
  #skip;
  #take;

  constructor(
    stream: SyncStream<T>,
    skip: number | undefined = undefined,
    take: number | undefined = undefined
  ) {
    super();
    this.#stream = stream;
    this.#skip = skip;
    this.#take = take;
  }

  nextItem(): StreamItem<T> {
    while (this.#skip) {
      const item = this.#stream.nextItem();
      if (!("i" in item)) return item;
      this.#skip--;
    }
    if (this.#take === undefined) {
      return this.#stream.nextItem();
    }
    if (!this.#take) return Items.done;
    const item = this.#stream.nextItem();
    if ("i" in item) this.#take--;
    return item;
  }
}

export class AsyncWindowStream<T> extends AsyncStream<T> {
  #stream;
  #skip;
  #take;

  constructor(
    stream: AsyncStream<T>,
    skip: number | undefined = undefined,
    take: number | undefined = undefined
  ) {
    super();
    this.#stream = stream;
    this.#skip = skip;
    this.#take = take;
  }

  async nextItem(): Promise<StreamItem<T>> {
    while (this.#skip) {
      const item = await this.#stream.nextItem();
      if (!("i" in item)) return item;
      this.#skip--;
    }
    if (this.#take === undefined) {
      return this.#stream.nextItem();
    }
    if (!this.#take) return Items.done;
    const item = await this.#stream.nextItem();
    if ("i" in item) this.#take--;
    return item;
  }
}
