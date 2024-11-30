import { AsyncStream, SyncStream } from "../base";
import { Promising, StreamItem, WhileStreamKind } from "../types";
import { Items } from "../utils";

export class SyncWhileStream<T> extends SyncStream<T> {
  #predicate;
  #stream;
  #next;
  #done = false;

  constructor(
    stream: SyncStream<T>,
    kind: WhileStreamKind,
    predicate: (a: T) => boolean
  ) {
    super();
    this.#predicate = predicate;
    this.#stream = stream;
    this.#next = (kind === "drop-while" ? this.#drop : this.#take).bind(this);
  }

  nextItem(): StreamItem<T> {
    return this.#next() as StreamItem<T>;
  }

  #drop() {
    if (!this.#done) {
      let item: StreamItem<T>;
      do {
        item = this.#stream.nextItem();
        if (!("value" in item)) return item;
      } while (this.#predicate(item.value));
      this.#done = true;
      return item;
    } else {
      return this.#stream.nextItem();
    }
  }

  #take() {
    const item = this.#stream.nextItem();
    if ("error" in item) return item;
    if ("value" in item && this.#predicate(item.value)) return item;
    return Items.done;
  }
}

export class AsyncWhileStream<T> extends AsyncStream<T> {
  #predicate;
  #stream;
  #next;
  #done = false;

  constructor(
    stream: AsyncStream<T>,
    kind: WhileStreamKind,
    predicate: (a: T) => Promising<boolean>
  ) {
    super();
    this.#predicate = predicate;
    this.#stream = stream;
    this.#next = (kind === "drop-while" ? this.#drop : this.#take).bind(this);
  }

  nextItem(): Promise<StreamItem<T>> {
    return this.#next() as Promise<StreamItem<T>>;
  }

  async #drop() {
    if (!this.#done) {
      let item: StreamItem<T>;
      do {
        item = await this.#stream.nextItem();
        if (!("value" in item)) return item;
      } while (await this.#predicate(item.value));
      this.#done = true;
      return item;
    } else {
      return this.#stream.nextItem();
    }
  }

  async #take() {
    const item = await this.#stream.nextItem();
    if ("error" in item) return item;
    if ("value" in item && (await this.#predicate(item.value))) return item;
    return Items.done;
  }
}
