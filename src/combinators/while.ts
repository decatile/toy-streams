import { AsyncStream, SyncStream } from "../base";
import { Promising, StreamItem, WhileStreamKind } from "../types";
import { Items } from "../utils";

const DROP = 0;
const DROP_ITEM = 1;
const NO_DROP = 2;

export class SyncWhileStream<T> extends SyncStream<T> {
  #predicate;
  #stream;
  #next;
  #done = DROP;
  #buf = null as StreamItem<T> | null;

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
    return this.#next() as any;
  }

  #drop() {
    switch (this.#done) {
      case DROP:
        let item: StreamItem<T>;
        do {
          item = this.#stream.nextItem();
          if (!("value" in item)) return item;
        } while (this.#predicate(item.value));
        this.#done = DROP_ITEM;
        this.#buf = item;
      case DROP_ITEM:
        this.#done = NO_DROP;
        return this.#buf!;
      case NO_DROP:
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
  #done = DROP;
  #buf = null as StreamItem<T> | null;

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
    return this.#next() as any;
  }

  async #drop() {
    switch (this.#done) {
      case DROP:
        let item: StreamItem<T>;
        do {
          item = await this.#stream.nextItem();
          if (!("value" in item)) return item;
        } while (await this.#predicate(item.value));
        this.#done = DROP_ITEM;
        this.#buf = item;
      case DROP_ITEM:
        this.#done = NO_DROP;
        return Items.item(this.#buf!);
      case NO_DROP:
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
