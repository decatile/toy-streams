type StreamItem<T> = { i: T } | { e: unknown } | { d: true };

const StreamItem = Object.freeze({
  done: { d: true } as { d: true } satisfies StreamItem<any>,
  item: <T>(value: T) => ({ i: value } satisfies StreamItem<T>),
  error: (error: unknown) => ({ e: error } satisfies StreamItem<any>),
  fromResult: <T>(item: IteratorResult<T>) =>
    item.done ? StreamItem.done : StreamItem.item(item.value),
  intoResult: <T>(item: StreamItem<T>) => {
    if ("i" in item) {
      return { done: false, value: item.i } as { done: false; value: T };
    }
    if ("d" in item) {
      return { done: true, value: undefined } as {
        done: true;
        value: undefined;
      };
    }
    throw item.e;
  },
});

type AnyItera<T> =
  | Iterable<T>
  | Iterator<T>
  | AsyncIterable<T>
  | AsyncIterator<T>;

function intoIterator<T>(it: AnyItera<T>): Iterator<T> | AsyncIterator<T> {
  return Symbol.iterator in it
    ? it[Symbol.iterator]()
    : Symbol.asyncIterator in it
    ? it[Symbol.asyncIterator]()
    : it;
}

export abstract class Stream<S> {
  constructor(readonly sync: S) {}

  static fail<T>(error: unknown): SyncStream<T> {
    return new SyncFailStream(error);
  }

  static sync<T>(it: Iterable<T> | Iterator<T>): SyncStream<T> {
    return new SyncIterableStream(
      Symbol.iterator in it ? it[Symbol.iterator]() : it
    );
  }

  static async<T>(it: AsyncIterable<T> | AsyncIterator<T>): AsyncStream<T> {
    return new AsyncIterableStream(
      Symbol.asyncIterator in it ? it[Symbol.asyncIterator]() : it
    );
  }

  static gather<T>(it: AnyItera<Promise<T>>): AsyncStream<T> {
    return new GatherIterableStream(intoIterator(it));
  }

  static flatten<T>(it: SyncStream<SyncStream<T>>): SyncStream<T>;
  static flatten<T>(
    it: AsyncStream<SyncStream<T> | AsyncStream<T>>
  ): AsyncStream<T>;
  static flatten(it: any): any {
    if (it.sync) {
      return new SyncFlattenStream(it);
    } else {
      return new AsyncFlattenStream(it);
    }
  }

  static count(start?: number): SyncStream<number> {
    return this.iterate((x) => x, start);
  }

  static iterate<T>(fn: (a: number) => T, start?: number): SyncStream<T> {
    return new SyncIterateStream(fn, start ?? 0);
  }

  static iterateAsync<T>(
    fn: (a: number) => T | Promise<T>,
    start: number = 0
  ): AsyncStream<T> {
    return new AsyncIterateStream(fn, start);
  }
}

export default Stream;

export abstract class SyncStream<T> extends Stream<true> {
  constructor() {
    super(true);
  }

  map<T1>(fn: (a: T) => T1): SyncStream<T1> {
    return new SyncMapStream(this, fn);
  }

  mapAsync<T1>(fn: (a: T) => Promise<T1>): AsyncStream<T1> {
    return new AsyncMapStream(this.intoAsync(), fn);
  }

  flatMap<T1>(fn: (a: T) => Iterable<T1> | Iterator<T1>): SyncStream<T1> {
    return new SyncFlatMapStream(this, fn);
  }

  flatMapAsync<T1>(
    fn: (a: T) => AnyItera<T1> | Promise<AnyItera<T1>>
  ): AsyncStream<T1> {
    return new AsyncFlatMapStream(this.intoAsync(), fn);
  }

  filter(fn: (a: T) => boolean): SyncStream<T> {
    return new SyncFilterStream(this, fn);
  }

  filterAsync(fn: (a: T) => Promise<boolean>): AsyncStream<T> {
    return new AsyncFilterStream(this.intoAsync(), fn);
  }

  window({ skip, take }: { skip?: number; take?: number }): SyncStream<T> {
    return new SyncWindowStream(this, skip, take);
  }

  forEach(fn: (a: T) => any): void {
    while (1) {
      const item = this.nextItem();
      if ("d" in item) return;
      if ("e" in item) throw item.e;
      fn(item.i);
    }
  }

  delayed(ms: number): AsyncStream<T> {
    return new AsyncDelayedStream(this.intoAsync(), ms);
  }

  extend(other: SyncStream<T>): SyncStream<T>;
  extend(other: AsyncStream<T>): AsyncStream<T>;
  extend(other: any): any {
    if (other.sync) {
      return new SyncExtendStream(this, other);
    } else {
      return new AsyncExtendStream(this.intoAsync(), other);
    }
  }

  reduce<R>(fn: (a: T, b: R) => R, init: R): R {
    while (1) {
      const item = this.nextItem();
      if ("d" in item) return init;
      if ("e" in item) throw item.e;
      init = fn(item.i, init);
    }
    throw Error("Impossible");
  }

  measured(): SyncStream<[T, number]> {
    return new SyncMeasuringStream(this);
  }

  intoAsync(): AsyncStream<T> {
    return new SyncIntoAsyncStreamAdapter(this);
  }

  iterator(): Iterable<T> & Iterator<T> {
    return new SyncIntoIteratorStreamAdapter(this);
  }

  batches(n: number): SyncStream<T[]> {
    return new SyncBatchesStream(this, n);
  }

  first(): T | null {
    const item = this.nextItem();
    if ("d" in item) return null;
    if ("e" in item) throw item.e;
    return item.i;
  }

  last(): T | null {
    let r: T | null = null;
    while (1) {
      const item = this.nextItem();
      if ("d" in item) break;
      if ("e" in item) throw item.e;
      r = item.i;
    }
    return r;
  }

  zipWith<T1, K extends ZipStreamKind>(
    other: SyncStream<T1>,
    kind: K
  ): SyncStream<ZipStreamReturnType<T, T1, K>>;
  zipWith<T1, K extends ZipStreamKind>(
    other: AsyncStream<T1>,
    kind: K
  ): AsyncStream<ZipStreamReturnType<T, T1, K>>;
  zipWith(other: any, kind: any): any {
    if (other.sync) {
      return new SyncZipStream(this, other, kind);
    } else {
      return new AsyncZipStream(this.intoAsync(), other, kind);
    }
  }

  abstract nextItem(): StreamItem<T>;
}

export abstract class AsyncStream<T> extends Stream<false> {
  constructor() {
    super(false);
  }

  map<T1>(fn: (a: T) => T1 | Promise<T1>): AsyncStream<T1> {
    return new AsyncMapStream(this, fn);
  }

  flatMap<T1>(
    fn: (a: T) => AnyItera<T1> | Promise<AnyItera<T1>>
  ): AsyncStream<T1> {
    return new AsyncFlatMapStream(this, fn);
  }

  filter(fn: (a: T) => boolean | Promise<boolean>): AsyncStream<T> {
    return new AsyncFilterStream(this, fn);
  }

  window(skip: number, take: number): AsyncStream<T> {
    return new AsyncWindowStream(this, skip, take);
  }

  async forEach(fn: (a: T) => any | Promise<any>): Promise<void> {
    while (1) {
      const item = await this.nextItem();
      if ("d" in item) return;
      if ("e" in item) throw item.e;
      await fn(item.i);
    }
  }

  delayed(ms: number): AsyncStream<T> {
    return new AsyncDelayedStream(this, ms);
  }

  extend(other: SyncStream<T> | AsyncStream<T>): AsyncStream<T> {
    return new AsyncExtendStream(this, other.sync ? other.intoAsync() : other);
  }

  async reduce<R>(fn: (a: T, b: R) => R | Promise<R>, init: R): Promise<R> {
    while (1) {
      const item = await this.nextItem();
      if ("d" in item) return init;
      if ("e" in item) throw item.e;
      init = await fn(item.i, init);
    }
    throw Error("Impossible");
  }

  measured(): AsyncStream<[T, number]> {
    return new AsyncMeasuredStream(this);
  }

  iterator(): AsyncIterable<T> & AsyncIterator<T> {
    return new AsyncIntoIteratorStreamAdapter(this);
  }

  batches(n: number): AsyncStream<T[]> {
    return new AsyncBatchesStream(this, n);
  }

  async first(): Promise<T | null> {
    const item = await this.nextItem();
    if ("d" in item) return null;
    if ("e" in item) throw item.e;
    return item.i;
  }

  async last(): Promise<T | null> {
    let r: T | null = null;
    while (1) {
      const item = await this.nextItem();
      if ("d" in item) break;
      if ("e" in item) throw item.e;
      r = item.i;
    }
    return r;
  }

  zipWith<T1, K extends ZipStreamKind>(
    other: SyncStream<T1> | AsyncStream<T1>,
    kind: K
  ): AsyncStream<ZipStreamReturnType<T, T1, K>> {
    return new AsyncZipStream(
      this,
      other.sync ? other.intoAsync() : other,
      kind
    );
  }

  abstract nextItem(): Promise<StreamItem<T>>;
}

class SyncIntoIteratorStreamAdapter<T> implements Iterable<T>, Iterator<T> {
  #stream;

  constructor(stream: SyncStream<T>) {
    this.#stream = stream;
  }

  [Symbol.iterator]() {
    return this;
  }

  next(): IteratorResult<T, any> {
    return StreamItem.intoResult(this.#stream.nextItem());
  }
}

class AsyncIntoIteratorStreamAdapter<T>
  implements AsyncIterable<T>, AsyncIterator<T>
{
  #stream;

  constructor(stream: AsyncStream<T>) {
    this.#stream = stream;
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  async next(): Promise<IteratorResult<T, any>> {
    return StreamItem.intoResult(await this.#stream.nextItem());
  }
}

class SyncFailStream<T> extends SyncStream<T> {
  #error;

  constructor(error: unknown) {
    super();
    this.#error = error;
  }

  nextItem(): StreamItem<T> {
    return StreamItem.error(this.#error);
  }
}

class SyncIntoAsyncStreamAdapter<T> extends AsyncStream<T> {
  #stream;

  constructor(stream: SyncStream<T>) {
    super();
    this.#stream = stream;
  }

  async nextItem(): Promise<StreamItem<T>> {
    return this.#stream.nextItem();
  }
}

class SyncIterableStream<T> extends SyncStream<T> {
  #it;

  constructor(it: Iterator<T>) {
    super();
    this.#it = it;
  }

  nextItem(): StreamItem<T> {
    try {
      return StreamItem.fromResult(this.#it.next());
    } catch (e) {
      return StreamItem.error(e);
    }
  }
}

class AsyncIterableStream<T> extends AsyncStream<T> {
  #it;

  constructor(it: AsyncIterator<T>) {
    super();
    this.#it = it;
  }

  async nextItem(): Promise<StreamItem<T>> {
    try {
      return StreamItem.fromResult(await this.#it.next());
    } catch (e) {
      return StreamItem.error(e);
    }
  }
}

class GatherIterableStream<T> extends AsyncStream<T> {
  #it;

  constructor(it: Iterator<Promise<T>> | AsyncIterator<Promise<T>>) {
    super();
    this.#it = it;
  }

  async nextItem(): Promise<StreamItem<T>> {
    try {
      const { done, value } = await this.#it.next();
      if (done) return StreamItem.done;
      return StreamItem.item(await value);
    } catch (e) {
      return StreamItem.error(e);
    }
  }
}

class SyncMapStream<T, T1> extends SyncStream<T1> {
  #stream;
  #fn;

  constructor(stream: SyncStream<T>, fn: (a: T) => T1) {
    super();
    this.#stream = stream;
    this.#fn = fn;
  }

  nextItem(): StreamItem<T1> {
    const item = this.#stream.nextItem();
    if (!("i" in item)) return item;
    try {
      return StreamItem.item(this.#fn(item.i));
    } catch (e) {
      return StreamItem.error(e);
    }
  }
}

class AsyncMapStream<T, T1> extends AsyncStream<T1> {
  #stream;
  #fn;

  constructor(stream: AsyncStream<T>, fn: (a: T) => T1 | Promise<T1>) {
    super();
    this.#stream = stream;
    this.#fn = fn;
  }

  async nextItem(): Promise<StreamItem<T1>> {
    const item = await this.#stream.nextItem();
    if (!("i" in item)) return item;
    try {
      return StreamItem.item(await this.#fn(item.i));
    } catch (e) {
      return StreamItem.error(e);
    }
  }
}

class SyncFlatMapStream<T, T1> extends SyncStream<T1> {
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
          if (!("i" in item)) return item;
          const it = this.#fn(item.i);
          this.#current = Symbol.iterator in it ? it[Symbol.iterator]() : it;
        }
      }
      const item = StreamItem.fromResult(this.#current!.next());
      if (!("d" in item)) return item;
      this.#current = null;
    } catch (e) {
      return StreamItem.error(e);
    }
    throw Error("Impossible");
  }
}

class AsyncFlatMapStream<T, T1> extends AsyncStream<T1> {
  #current: Iterator<T1> | AsyncIterator<T1> | null = null;
  #stream;
  #fn;

  constructor(
    stream: AsyncStream<T>,
    fn: (a: T) => AnyItera<T1> | Promise<AnyItera<T1>>
  ) {
    super();
    this.#stream = stream;
    this.#fn = fn;
  }

  async nextItem(): Promise<StreamItem<T1>> {
    try {
      while (1) {
        if (!this.#current) {
          const item = await this.#stream.nextItem();
          if (!("i" in item)) return item;
          const it = await this.#fn(item.i);
          this.#current =
            Symbol.iterator in it
              ? it[Symbol.iterator]()
              : Symbol.asyncIterator in it
              ? it[Symbol.asyncIterator]()
              : it;
        }
      }
      const item = StreamItem.fromResult(await this.#current!.next());
      if (!("d" in item)) return item;
      this.#current = null;
    } catch (e) {
      return StreamItem.error(e);
    }
    throw Error("Impossible");
  }
}

class SyncFilterStream<T> extends SyncStream<T> {
  #stream;
  #fn;

  constructor(stream: SyncStream<T>, fn: (a: T) => boolean) {
    super();
    this.#stream = stream;
    this.#fn = fn;
  }

  nextItem(): StreamItem<T> {
    try {
      while (1) {
        const item = this.#stream.nextItem();
        if (!("i" in item) || this.#fn(item.i)) return item;
      }
    } catch (e) {
      return StreamItem.error(e);
    }
    throw Error("Impossible");
  }
}

class AsyncFilterStream<T> extends AsyncStream<T> {
  #stream;
  #fn;

  constructor(
    stream: AsyncStream<T>,
    fn: (a: T) => boolean | Promise<boolean>
  ) {
    super();
    this.#stream = stream;
    this.#fn = fn;
  }

  async nextItem(): Promise<StreamItem<T>> {
    try {
      while (1) {
        const item = await this.#stream.nextItem();
        if (!("i" in item) || (await this.#fn(item.i))) return item;
      }
    } catch (e) {
      return StreamItem.error(e);
    }
    throw Error("Impossible");
  }
}

class SyncWindowStream<T> extends SyncStream<T> {
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
    if (!this.#take) return StreamItem.done;
    const item = this.#stream.nextItem();
    if ("i" in item) this.#take--;
    return item;
  }
}

class AsyncWindowStream<T> extends AsyncStream<T> {
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
    if (!this.#take) return StreamItem.done;
    const item = await this.#stream.nextItem();
    if ("i" in item) this.#take--;
    return item;
  }
}

class SyncFlattenStream<T> extends SyncStream<T> {
  #current: SyncStream<T> | null = null;
  #stream;

  constructor(stream: SyncStream<SyncStream<T>>) {
    super();
    this.#stream = stream;
  }

  nextItem(): StreamItem<T> {
    while (1) {
      if (!this.#current) {
        const item = this.#stream.nextItem();
        if (!("i" in item)) return item;
        this.#current = item.i;
      }
      const item = this.#current.nextItem();
      if (!("d" in item)) return item;
      this.#current = null;
    }
    throw Error("Impossible");
  }
}

class AsyncFlattenStream<T> extends AsyncStream<T> {
  #current: AsyncStream<T> | null = null;
  #stream;

  constructor(stream: AsyncStream<SyncStream<T> | AsyncStream<T>>) {
    super();
    this.#stream = stream;
  }

  async nextItem(): Promise<StreamItem<T>> {
    while (1) {
      if (!this.#current) {
        const item = await this.#stream.nextItem();
        if (!("i" in item)) return item;
        this.#current = item.i.sync ? item.i.intoAsync() : item.i;
      }
      const item = await this.#current.nextItem();
      if (!("d" in item)) return item;
      this.#current = null;
    }
    throw Error("Impossible");
  }
}

class SyncIterateStream<T> extends SyncStream<T> {
  #fn;
  #start;

  constructor(fn: (a: number) => T, start: number) {
    super();
    this.#fn = fn;
    this.#start = start;
  }

  nextItem(): StreamItem<T> {
    try {
      return StreamItem.item(this.#fn(this.#start++));
    } catch (e) {
      return StreamItem.error(e);
    }
  }
}

class AsyncIterateStream<T> extends AsyncStream<T> {
  #fn;
  #start;

  constructor(fn: (a: number) => T | Promise<T>, start: number) {
    super();
    this.#fn = fn;
    this.#start = start;
  }

  async nextItem(): Promise<StreamItem<T>> {
    try {
      return StreamItem.item(await this.#fn(this.#start++));
    } catch (e) {
      return StreamItem.error(e);
    }
  }
}

class AsyncDelayedStream<T> extends AsyncStream<T> {
  #stream;
  #ms;

  constructor(stream: AsyncStream<T>, ms: number) {
    super();
    this.#stream = stream;
    this.#ms = ms;
  }

  async nextItem(): Promise<StreamItem<T>> {
    await new Promise((r) => setTimeout(r, this.#ms));
    return this.#stream.nextItem();
  }
}

class SyncExtendStream<T> extends SyncStream<T> {
  #streams: SyncStream<T>[];
  #index: number = 0;

  constructor(s1: SyncStream<T>, s2: SyncStream<T>) {
    super();
    this.#streams = [s1, s2];
  }

  nextItem(): StreamItem<T> {
    while (1) {
      const current = this.#streams[this.#index];
      if (!current) return StreamItem.done;
      const item = current.nextItem();
      if (!("d" in item)) return item;
      this.#index++;
    }
    throw Error("Impossible");
  }
}

class AsyncExtendStream<T> extends AsyncStream<T> {
  #streams: AsyncStream<T>[];
  #index: number = 0;

  constructor(s1: AsyncStream<T>, s2: AsyncStream<T>) {
    super();
    this.#streams = [s1, s2];
  }

  async nextItem(): Promise<StreamItem<T>> {
    while (1) {
      const current = this.#streams[this.#index];
      if (!current) return StreamItem.done;
      const item = await current.nextItem();
      if (!("d" in item)) return item;
      this.#index++;
    }
    throw Error("Impossible");
  }
}

class SyncMeasuringStream<T> extends SyncStream<[T, number]> {
  #stream;

  constructor(stream: SyncStream<T>) {
    super();
    this.#stream = stream;
  }

  nextItem(): StreamItem<[T, number]> {
    const from = performance.now();
    const item = this.#stream.nextItem();
    if (!("i" in item)) return item;
    return StreamItem.item([item.i, performance.now() - from]);
  }
}

class AsyncMeasuredStream<T> extends AsyncStream<[T, number]> {
  #stream;

  constructor(stream: AsyncStream<T>) {
    super();
    this.#stream = stream;
  }

  async nextItem(): Promise<StreamItem<[T, number]>> {
    const from = performance.now();
    const item = await this.#stream.nextItem();
    if (!("i" in item)) return item;
    return StreamItem.item([item.i, performance.now() - from]);
  }
}

class SyncBatchesStream<T> extends SyncStream<T[]> {
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
    if (this.#done) return StreamItem.done;
    while (this.#storage.length < this.#count) {
      const item = this.#stream.nextItem();
      if ("d" in item) {
        this.#done = true;
        return StreamItem.item(this.#swap());
      }
      if ("e" in item) return item;
      this.#storage.push(item.i);
    }
    return StreamItem.item(this.#swap());
  }
}

class AsyncBatchesStream<T> extends AsyncStream<T[]> {
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
    if (this.#done) return StreamItem.done;
    while (this.#storage.length < this.#count) {
      const item = await this.#stream.nextItem();
      if ("d" in item) {
        this.#done = true;
        return StreamItem.item(this.#swap());
      }
      if ("e" in item) return item;
      this.#storage.push(item.i);
    }
    return StreamItem.item(this.#swap());
  }
}

type ZipStreamKind = "inner" | "left" | "right" | "full";

type ZipStreamReturnType<A, B, K extends ZipStreamKind> = {
  inner: [A, B];
  left: [A, B | null];
  right: [A | null, B];
  full: [A, B] | [A, null] | [null, B];
}[K];

class SyncZipStream<A, B, K extends ZipStreamKind> extends SyncStream<
  ZipStreamReturnType<A, B, K>
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

  nextItem(): StreamItem<ZipStreamReturnType<A, B, K>> {
    return this.#next() as any;
  }

  #inner() {
    const i1 = this.#as.nextItem();
    if (!("i" in i1)) return i1;
    const i2 = this.#bs.nextItem();
    if (!("i" in i2)) return i2;
    return StreamItem.item([i1.i, i2.i] as [A, B]);
  }

  #left() {
    const i1 = this.#as.nextItem();
    if (!("i" in i1)) return i1;
    let i2: StreamItem<B>;
    if (this.#bexhausted) {
      i2 = StreamItem.done;
    } else {
      i2 = this.#bs.nextItem();
      if ("d" in i2) this.#bexhausted = true;
      if ("e" in i2) return i2;
    }
    return StreamItem.item([i1.i, "i" in i2 ? i2.i : null] as [A, B | null]);
  }

  #right() {
    let i1;
    if (this.#aexhausted) {
      i1 = StreamItem.done;
    } else {
      i1 = this.#as.nextItem();
      if ("d" in i1) this.#aexhausted = true;
      if ("e" in i1) return i1;
    }
    const i2 = this.#bs.nextItem();
    if (!("i" in i2)) return i2;
    return StreamItem.item(["i" in i1 ? i1.i : null, i2.i] as [A | null, B]);
  }

  #full() {
    let i1;
    if (this.#aexhausted) {
      i1 = StreamItem.done;
    } else {
      i1 = this.#as.nextItem();
      if ("d" in i1) this.#aexhausted = true;
      if ("e" in i1) return i1;
    }
    let i2: StreamItem<B>;
    if (this.#bexhausted) {
      i2 = StreamItem.done;
    } else {
      i2 = this.#bs.nextItem();
      if ("d" in i2) this.#bexhausted = true;
      if ("e" in i2) return i2;
    }
    if (this.#aexhausted && this.#bexhausted) return StreamItem.done;
    return StreamItem.item([
      "i" in i1 ? i1.i : null,
      "i" in i2 ? i2.i : null,
    ] as [A, B] | [A, null] | [null, B]);
  }
}

class AsyncZipStream<A, B, K extends ZipStreamKind> extends AsyncStream<
  ZipStreamReturnType<A, B, K>
> {
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

  nextItem(): Promise<StreamItem<ZipStreamReturnType<A, B, K>>> {
    return this.#next() as any;
  }

  async #inner() {
    const i1 = await this.#as.nextItem();
    if (!("i" in i1)) return i1;
    const i2 = await this.#bs.nextItem();
    if (!("i" in i2)) return i2;
    return StreamItem.item([i1.i, i2.i] as [A, B]);
  }

  async #left() {
    const i1 = await this.#as.nextItem();
    if (!("i" in i1)) return i1;
    let i2: StreamItem<B>;
    if (this.#bexhausted) {
      i2 = StreamItem.done;
    } else {
      i2 = await this.#bs.nextItem();
      if ("d" in i2) this.#bexhausted = true;
      if ("e" in i2) return i2;
    }
    return StreamItem.item([i1.i, "i" in i2 ? i2.i : null] as [A, B | null]);
  }

  async #right() {
    let i1;
    if (this.#aexhausted) {
      i1 = StreamItem.done;
    } else {
      i1 = await this.#as.nextItem();
      if ("d" in i1) this.#aexhausted = true;
      if ("e" in i1) return i1;
    }
    const i2 = await this.#bs.nextItem();
    if (!("i" in i2)) return i2;
    return StreamItem.item(["i" in i1 ? i1.i : null, i2.i] as [A | null, B]);
  }

  async #full() {
    let i1;
    if (this.#aexhausted) {
      i1 = StreamItem.done;
    } else {
      i1 = await this.#as.nextItem();
      if ("d" in i1) this.#aexhausted = true;
      if ("e" in i1) return i1;
    }
    let i2: StreamItem<B>;
    if (this.#bexhausted) {
      i2 = StreamItem.done;
    } else {
      i2 = await this.#bs.nextItem();
      if ("d" in i2) this.#bexhausted = true;
      if ("e" in i2) return i2;
    }
    if (this.#aexhausted && this.#bexhausted) return StreamItem.done;
    return StreamItem.item([
      "i" in i1 ? i1.i : null,
      "i" in i2 ? i2.i : null,
    ] as [A, B] | [A, null] | [null, B]);
  }
}
