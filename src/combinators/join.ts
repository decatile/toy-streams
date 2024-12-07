import { SyncStream, AsyncStream } from "../base";
import { StreamItem, JoinStreamKind, JoinStreamReturnType } from "../types";
import { Item } from "../utils";

export class SyncJoinStream<A, B, K extends JoinStreamKind> extends SyncStream<
  JoinStreamReturnType<A, B, K>
> {
  #aexhausted = false;
  #bexhausted = false;
  #next;
  #as;
  #bs;

  constructor(as: SyncStream<A>, bs: SyncStream<B>, kind: K) {
    super();
    this.#as = as;
    this.#bs = bs;
    this.#next = (
      kind === "inner-join"
        ? this.#inner
        : kind === "left-join"
        ? this.#left
        : kind === "right-join"
        ? this.#right
        : this.#full
    ).bind(this);
  }

  nextItem(): StreamItem<JoinStreamReturnType<A, B, K>> {
    return this.#next() as StreamItem<JoinStreamReturnType<A, B, K>>;
  }

  #inner() {
    const i1 = this.#as.nextItem();
    if (!("value" in i1)) return i1;
    const i2 = this.#bs.nextItem();
    if (!("value" in i2)) return i2;
    return Item.value([i1.value, i2.value] as [A, B]);
  }

  #left() {
    const i1 = this.#as.nextItem();
    if (!("value" in i1)) return i1;
    let i2: StreamItem<B>;
    if (this.#bexhausted) {
      i2 = Item.done;
    } else {
      i2 = this.#bs.nextItem();
      if ("done" in i2) this.#bexhausted = true;
      if ("error" in i2) return i2;
    }
    return Item.value([i1.value, "value" in i2 ? i2.value : null] as [
      A,
      B | null
    ]);
  }

  #right() {
    let i1;
    if (this.#aexhausted) {
      i1 = Item.done;
    } else {
      i1 = this.#as.nextItem();
      if ("done" in i1) this.#aexhausted = true;
      if ("error" in i1) return i1;
    }
    const i2 = this.#bs.nextItem();
    if (!("value" in i2)) return i2;
    return Item.value(["value" in i1 ? i1.value : null, i2.value] as [
      A | null,
      B
    ]);
  }

  #full() {
    let i1;
    if (this.#aexhausted) {
      i1 = Item.done;
    } else {
      i1 = this.#as.nextItem();
      if ("done" in i1) this.#aexhausted = true;
      if ("error" in i1) return i1;
    }
    let i2: StreamItem<B>;
    if (this.#bexhausted) {
      i2 = Item.done;
    } else {
      i2 = this.#bs.nextItem();
      if ("done" in i2) this.#bexhausted = true;
      if ("error" in i2) return i2;
    }
    if (this.#aexhausted && this.#bexhausted) return Item.done;
    return Item.value([
      "value" in i1 ? i1.value : null,
      "value" in i2 ? i2.value : null,
    ] as [A, B] | [A, null] | [null, B]);
  }
}

export class AsyncJoinStream<
  A,
  B,
  K extends JoinStreamKind
> extends AsyncStream<JoinStreamReturnType<A, B, K>> {
  #aexhausted = false;
  #bexhausted = false;
  #next;
  #as;
  #bs;

  constructor(as: AsyncStream<A>, bs: AsyncStream<B>, kind: K) {
    super();
    this.#as = as;
    this.#bs = bs;
    this.#next = (
      kind === "inner-join"
        ? this.#inner
        : kind === "left-join"
        ? this.#left
        : kind === "right-join"
        ? this.#right
        : this.#full
    ).bind(this);
  }

  nextItem(): Promise<StreamItem<JoinStreamReturnType<A, B, K>>> {
    return this.#next() as Promise<StreamItem<JoinStreamReturnType<A, B, K>>>;
  }

  async #leftAwaiter() {
    if (this.#aexhausted) {
      return Item.done;
    } else {
      const r = await this.#as.nextItem();
      if ("done" in r) this.#aexhausted = true;
      return r;
    }
  }

  async #rightAwaiter() {
    if (this.#bexhausted) {
      return Item.done;
    } else {
      const r = await this.#bs.nextItem();
      if ("done" in r) this.#bexhausted = true;
      return r;
    }
  }

  async #inner() {
    const [i1, i2] = await Promise.all([
      this.#as.nextItem(),
      this.#bs.nextItem(),
    ]);
    if (!("value" in i1)) return i1;
    if (!("value" in i2)) return i2;
    return Item.value([i1.value, i2.value] as [A, B]);
  }

  async #left() {
    const [i1, i2] = await Promise.all([
      this.#as.nextItem(),
      this.#rightAwaiter(),
    ]);
    if (!("value" in i1)) return i1;
    if ("error" in i2) return i2;
    return Item.value([i1.value, "value" in i2 ? i2.value : null] as [
      A,
      B | null
    ]);
  }

  async #right() {
    const [i1, i2] = await Promise.all([
      this.#leftAwaiter(),
      this.#bs.nextItem(),
    ]);
    if ("error" in i1) return i1;
    if (!("value" in i2)) return i2;
    return Item.value(["value" in i1 ? i1.value : null, i2.value] as [
      A | null,
      B
    ]);
  }

  async #full() {
    const [i1, i2] = await Promise.all([
      this.#leftAwaiter(),
      this.#rightAwaiter(),
    ]);
    if ("error" in i1) return i1;
    if ("error" in i2) return i2;
    if ("value" in i1 || "value" in i2) {
      return Item.value([
        "value" in i1 ? i1.value : null,
        "value" in i2 ? i2.value : null,
      ] as [A, B] | [A, null] | [null, B]);
    }
    return Item.done;
  }
}
