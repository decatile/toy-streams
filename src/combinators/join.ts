import { SyncStream, AsyncStream } from "../base";
import { StreamItem, JoinStreamKind, JoinStreamReturnType } from "../types";
import { Items } from "../utils";

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
      kind === "inner"
        ? this.#inner
        : kind === "left"
        ? this.#left
        : kind === "right"
        ? this.#right
        : this.#full
    ).bind(this);
  }

  nextItem(): StreamItem<JoinStreamReturnType<A, B, K>> {
    return this.#next() as any;
  }

  #inner() {
    const i1 = this.#as.nextItem();
    if (!("value" in i1)) return i1;
    const i2 = this.#bs.nextItem();
    if (!("value" in i2)) return i2;
    return Items.item([i1.value, i2.value] as [A, B]);
  }

  #left() {
    const i1 = this.#as.nextItem();
    if (!("value" in i1)) return i1;
    let i2: StreamItem<B>;
    if (this.#bexhausted) {
      i2 = Items.done;
    } else {
      i2 = this.#bs.nextItem();
      if ("done" in i2) this.#bexhausted = true;
      if ("error" in i2) return i2;
    }
    return Items.item([i1.value, "value" in i2 ? i2.value : null] as [
      A,
      B | null
    ]);
  }

  #right() {
    let i1;
    if (this.#aexhausted) {
      i1 = Items.done;
    } else {
      i1 = this.#as.nextItem();
      if ("done" in i1) this.#aexhausted = true;
      if ("error" in i1) return i1;
    }
    const i2 = this.#bs.nextItem();
    if (!("value" in i2)) return i2;
    return Items.item(["value" in i1 ? i1.value : null, i2.value] as [
      A | null,
      B
    ]);
  }

  #full() {
    let i1;
    if (this.#aexhausted) {
      i1 = Items.done;
    } else {
      i1 = this.#as.nextItem();
      if ("done" in i1) this.#aexhausted = true;
      if ("error" in i1) return i1;
    }
    let i2: StreamItem<B>;
    if (this.#bexhausted) {
      i2 = Items.done;
    } else {
      i2 = this.#bs.nextItem();
      if ("done" in i2) this.#bexhausted = true;
      if ("error" in i2) return i2;
    }
    if (this.#aexhausted && this.#bexhausted) return Items.done;
    return Items.item([
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
      kind === "inner"
        ? this.#inner
        : kind === "left"
        ? this.#left
        : kind === "right"
        ? this.#right
        : this.#full
    ).bind(this);
  }

  nextItem(): Promise<StreamItem<JoinStreamReturnType<A, B, K>>> {
    return this.#next() as any;
  }

  async #inner() {
    const i1 = await this.#as.nextItem();
    if (!("value" in i1)) return i1;
    const i2 = await this.#bs.nextItem();
    if (!("value" in i2)) return i2;
    return Items.item([i1.value, i2.value] as [A, B]);
  }

  async #left() {
    const i1 = await this.#as.nextItem();
    if (!("value" in i1)) return i1;
    let i2: StreamItem<B>;
    if (this.#bexhausted) {
      i2 = Items.done;
    } else {
      i2 = await this.#bs.nextItem();
      if ("done" in i2) this.#bexhausted = true;
      if ("error" in i2) return i2;
    }
    return Items.item([i1.value, "value" in i2 ? i2.value : null] as [
      A,
      B | null
    ]);
  }

  async #right() {
    let i1;
    if (this.#aexhausted) {
      i1 = Items.done;
    } else {
      i1 = await this.#as.nextItem();
      if ("done" in i1) this.#aexhausted = true;
      if ("error" in i1) return i1;
    }
    const i2 = await this.#bs.nextItem();
    if (!("value" in i2)) return i2;
    return Items.item(["value" in i1 ? i1.value : null, i2.value] as [
      A | null,
      B
    ]);
  }

  async #full() {
    let i1;
    if (this.#aexhausted) {
      i1 = Items.done;
    } else {
      i1 = await this.#as.nextItem();
      if ("done" in i1) this.#aexhausted = true;
      if ("error" in i1) return i1;
    }
    let i2: StreamItem<B>;
    if (this.#bexhausted) {
      i2 = Items.done;
    } else {
      i2 = await this.#bs.nextItem();
      if ("done" in i2) this.#bexhausted = true;
      if ("error" in i2) return i2;
    }
    if (this.#aexhausted && this.#bexhausted) return Items.done;
    return Items.item([
      "value" in i1 ? i1.value : null,
      "value" in i2 ? i2.value : null,
    ] as [A, B] | [A, null] | [null, B]);
  }
}
