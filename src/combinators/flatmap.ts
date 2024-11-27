import { AsyncStream, SyncStream } from "../base";
import { AnyItera, Promising, StreamItem } from "../types";
import { Items } from "../utils";

export class SyncFlatMapStream<T, T1> extends SyncStream<T1> {
  #current: Iterator<T1> | null = null;
  #stream;
  #fn;

  constructor(
    stream: SyncStream<T>,
    fn: (a: T) => Iterable<T1> | Iterator<T1>
  ) {
    super();
    this.#stream = stream;
    this.#fn = fn;
  }

  nextItem(): StreamItem<T1> {
    try {
      while (1) {
        if (!this.#current) {
          const item = this.#stream.nextItem();
          if (!("value" in item)) return item;
          const it = this.#fn(item.value);
          this.#current = Symbol.iterator in it ? it[Symbol.iterator]() : it;
        }
        const item = Items.from(this.#current!.next());
        if (!("done" in item)) return item;
        this.#current = null;
      }
    } catch (e) {
      return Items.error(e);
    }
    throw Error("Impossible");
  }
}

export class AsyncFlatMapStream<T, T1> extends AsyncStream<T1> {
  #current: Iterator<T1> | AsyncIterator<T1> | null = null;
  #stream;
  #fn;

  constructor(stream: AsyncStream<T>, fn: (a: T) => Promising<AnyItera<T1>>) {
    super();
    this.#stream = stream;
    this.#fn = fn;
  }

  async nextItem(): Promise<StreamItem<T1>> {
    try {
      while (1) {
        if (!this.#current) {
          const item = await this.#stream.nextItem();
          if (!("value" in item)) return item;
          const it = await this.#fn(item.value);
          this.#current =
            Symbol.iterator in it
              ? it[Symbol.iterator]()
              : Symbol.asyncIterator in it
              ? it[Symbol.asyncIterator]()
              : it;
        }
      }
      const item = Items.from(await this.#current!.next());
      if (!("done" in item)) return item;
      this.#current = null;
    } catch (e) {
      return Items.error(e);
    }
    throw Error("Impossible");
  }
}
