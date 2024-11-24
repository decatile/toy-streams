function eos() {
  return { done: true, value: undefined as any };
}

export abstract class Stream<S> {
  constructor(readonly sync: S) {}

  static once<T>(fn: () => T): SyncStream<T> {
    return new SyncOnceStream(fn);
  }

  static onceAsync<T>(fn: () => Promise<T>): AsyncStream<T> {
    return new AsyncOnceStream(fn);
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

  static gather<T>(
    it:
      | Iterable<Promise<T>>
      | Iterator<Promise<T>>
      | AsyncIterable<Promise<T>>
      | AsyncIterator<Promise<T>>
  ): AsyncStream<T> {
    return new GatherIterableStream(
      Symbol.iterator in it
        ? it[Symbol.iterator]()
        : Symbol.asyncIterator in it
        ? it[Symbol.asyncIterator]()
        : it
    );
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

  static iterate<T>(fn: (a: number) => T, start: number = 0): SyncStream<T> {
    return new SyncIterateStream(fn, start);
  }

  static iterateAsync<T>(
    fn: (a: number) => T | Promise<T>,
    start: number = 0
  ): AsyncStream<T> {
    return new AsyncIterateStream(fn, start);
  }
}

export default Stream;

export abstract class SyncStream<T>
  extends Stream<true>
  implements Iterable<T>, Iterator<T>
{
  constructor() {
    super(true);
  }

  [Symbol.iterator]() {
    return this;
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
    fn: (
      a: T
    ) =>
      | (Iterable<T1> | Iterator<T1> | AsyncIterable<T1> | AsyncIterator<T1>)
      | Promise<
          Iterable<T1> | Iterator<T1> | AsyncIterable<T1> | AsyncIterator<T1>
        >
  ) {
    return new AsyncFlatMapStream(this.intoAsync(), fn);
  }

  filter(fn: (a: T) => boolean): SyncStream<T> {
    return new SyncFilterStream(this, fn);
  }

  filterAsync(fn: (a: T) => Promise<boolean>): AsyncStream<T> {
    return new AsyncFilterStream(this.intoAsync(), fn);
  }

  window(skip: number, take: number): SyncStream<T> {
    return new SyncWindowStream(this, skip, take);
  }

  forEach(fn: (a: T) => any): void {
    while (1) {
      const { done, value } = this.next();
      if (done) return;
      fn(value);
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
      const { done, value } = this.next();
      if (done) return init;
      init = fn(value, init);
    }
    throw Error("Impossible");
  }

  collect(): T[] {
    return [...this];
  }

  measuring(): SyncStream<[T, number]> {
    return new SyncMeasuringStream(this);
  }

  intoAsync(): AsyncStream<T> {
    return new SyncIntoAsyncStreamAdapter(this);
  }

  abstract next(): IteratorResult<T>;
}

export abstract class AsyncStream<T>
  extends Stream<false>
  implements AsyncIterable<T>, AsyncIterator<T>
{
  constructor() {
    super(false);
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  map<T1>(fn: (a: T) => T1 | Promise<T1>): AsyncStream<T1> {
    return new AsyncMapStream(this, fn);
  }

  flatMap<T1>(
    fn: (
      a: T
    ) =>
      | (Iterable<T1> | Iterator<T1> | AsyncIterable<T1> | AsyncIterator<T1>)
      | Promise<
          Iterable<T1> | Iterator<T1> | AsyncIterable<T1> | AsyncIterator<T1>
        >
  ) {
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
      const { done, value } = await this.next();
      if (done) return;
      await fn(value);
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
      const { done, value } = await this.next();
      if (done) return init;
      init = await fn(value, init);
    }
    throw Error("Impossible");
  }

  async collect(): Promise<T[]> {
    const result: T[] = [];
    for await (const x of this) result.push(x);
    return result;
  }

  measuring(): AsyncStream<[T, number]> {
    return new AsyncMeasuringStream(this);
  }

  abstract next(): Promise<IteratorResult<T>>;
}

class SyncIntoAsyncStreamAdapter<T> extends AsyncStream<T> {
  constructor(private stream: SyncStream<T>) {
    super();
  }

  async next(): Promise<IteratorResult<T, any>> {
    return this.stream.next();
  }
}

class SyncOnceStream<T> extends SyncStream<T> {
  private called: boolean = false;

  constructor(private fn: () => T) {
    super();
  }

  next(): IteratorResult<T, any> {
    if (this.called) return eos();
    this.called = true;
    return { done: false, value: this.fn() };
  }
}

class AsyncOnceStream<T> extends AsyncStream<T> {
  private called: boolean = false;

  constructor(private fn: () => Promise<T>) {
    super();
  }

  async next(): Promise<IteratorResult<T, any>> {
    if (this.called) return eos();
    this.called = true;
    return { done: false, value: await this.fn() };
  }
}

class SyncIterableStream<T> extends SyncStream<T> {
  constructor(private it: Iterator<T>) {
    super();
  }

  next(): IteratorResult<T, any> {
    return this.it.next();
  }
}

class AsyncIterableStream<T> extends AsyncStream<T> {
  constructor(private it: AsyncIterator<T>) {
    super();
  }

  next(): Promise<IteratorResult<T>> {
    return this.it.next();
  }
}

class GatherIterableStream<T> extends AsyncStream<T> {
  constructor(private it: Iterator<Promise<T>> | AsyncIterator<Promise<T>>) {
    super();
  }

  async next(): Promise<IteratorResult<T>> {
    const { done, value } = await this.it.next();
    return { done, value: await value };
  }
}

class SyncMapStream<T, T1> extends SyncStream<T1> {
  constructor(private stream: SyncStream<T>, private fn: (a: T) => T1) {
    super();
  }

  next(): IteratorResult<T1, any> {
    const { done, value } = this.stream.next();
    if (done) return eos();
    return { done, value: this.fn(value) };
  }
}

class AsyncMapStream<T, T1> extends AsyncStream<T1> {
  constructor(
    private stream: AsyncStream<T>,
    private fn: (a: T) => T1 | Promise<T1>
  ) {
    super();
  }

  async next(): Promise<IteratorResult<T1, any>> {
    const { done, value } = await this.stream.next();
    if (done) return eos();
    return { done, value: await this.fn(value) };
  }
}

class SyncFlatMapStream<T, T1> extends SyncStream<T1> {
  private current: Iterator<T1> | null = null;

  constructor(
    private stream: SyncStream<T>,
    private fn: (a: T) => Iterable<T1> | Iterator<T1>
  ) {
    super();
  }

  next(): IteratorResult<T1, any> {
    while (1) {
      if (!this.current) {
        const { done, value } = this.stream.next();
        if (done) return { done, value };
        const it = this.fn(value);
        this.current = Symbol.iterator in it ? it[Symbol.iterator]() : it;
      }
      const { done, value } = this.current.next();
      if (!done) return { done, value };
      this.current = null;
    }
    throw Error("Impossible");
  }
}

class AsyncFlatMapStream<T, T1> extends AsyncStream<T1> {
  private current: Iterator<T1> | AsyncIterator<T1> | null = null;

  constructor(
    private stream: AsyncStream<T>,
    private fn: (
      a: T
    ) =>
      | (Iterable<T1> | Iterator<T1> | AsyncIterable<T1> | AsyncIterator<T1>)
      | Promise<
          Iterable<T1> | Iterator<T1> | AsyncIterable<T1> | AsyncIterator<T1>
        >
  ) {
    super();
  }

  async next(): Promise<IteratorResult<T1, any>> {
    while (1) {
      if (!this.current) {
        const { done, value } = await this.stream.next();
        if (done) return { done, value };
        const it = await this.fn(value);
        this.current =
          Symbol.iterator in it
            ? it[Symbol.iterator]()
            : Symbol.asyncIterator in it
            ? it[Symbol.asyncIterator]()
            : it;
      }
      const { done, value } = await this.current.next();
      if (!done) return { done, value };
      this.current = null;
    }
    throw Error("Impossible");
  }
}

class SyncFilterStream<T> extends SyncStream<T> {
  constructor(private stream: SyncStream<T>, private fn: (a: T) => boolean) {
    super();
  }

  next(): IteratorResult<T, any> {
    while (1) {
      const { done, value } = this.stream.next();
      if (done) return eos();
      if (this.fn(value)) return { done, value };
    }
    throw Error("Impossible");
  }
}

class AsyncFilterStream<T> extends AsyncStream<T> {
  constructor(
    private stream: AsyncStream<T>,
    private fn: (a: T) => boolean | Promise<boolean>
  ) {
    super();
  }

  async next(): Promise<IteratorResult<T, any>> {
    while (1) {
      const { done, value } = await this.stream.next();
      if (done) return eos();
      if (await this.fn(value)) return { done, value };
    }
    throw Error("Impossible");
  }
}

class SyncWindowStream<T> extends SyncStream<T> {
  constructor(
    private stream: SyncStream<T>,
    private skip: number,
    private take: number
  ) {
    super();
  }

  next(): IteratorResult<T, any> {
    while (this.skip) {
      if (this.stream.next().done) return eos();
      this.skip--;
    }
    if (!this.take) return eos();
    const { done, value } = this.stream.next();
    if (done) return eos();
    this.take--;
    return { done, value };
  }
}

class AsyncWindowStream<T> extends AsyncStream<T> {
  constructor(
    private stream: AsyncStream<T>,
    private skip: number,
    private take: number
  ) {
    super();
  }

  async next(): Promise<IteratorResult<T, any>> {
    while (this.skip) {
      if ((await this.stream.next()).done) return eos();
      this.skip--;
    }
    if (!this.take) return eos();
    const { done, value } = await this.stream.next();
    if (done) return { done, value };
    this.take--;
    return { done, value };
  }
}

class SyncFlattenStream<T> extends SyncStream<T> {
  private current: SyncStream<T> | null = null;

  constructor(private stream: SyncStream<SyncStream<T>>) {
    super();
  }

  next(): IteratorResult<T, any> {
    while (1) {
      if (!this.current) {
        const { done, value } = this.stream.next();
        if (done) return { done, value };
        this.current = value;
      }
      const { done, value } = this.current.next();
      if (!done) return { done, value };
      this.current = null;
    }
    throw Error("Impossible");
  }
}

class AsyncFlattenStream<T> extends AsyncStream<T> {
  private current: AsyncStream<T> | null = null;

  constructor(private stream: AsyncStream<SyncStream<T> | AsyncStream<T>>) {
    super();
  }

  async next(): Promise<IteratorResult<T, any>> {
    while (1) {
      if (!this.current) {
        const { done, value } = await this.stream.next();
        if (done) return { done, value };
        this.current = value.sync ? value.intoAsync() : value;
      }
      const { done, value } = await this.current.next();
      if (!done) return { done, value };
      this.current = null;
    }
    throw Error("Impossible");
  }
}

class SyncIterateStream<T> extends SyncStream<T> {
  constructor(private fn: (a: number) => T, private start: number) {
    super();
  }

  next(): IteratorResult<T, any> {
    return { done: false, value: this.fn(this.start++) };
  }
}

class AsyncIterateStream<T> extends AsyncStream<T> {
  constructor(
    private fn: (a: number) => T | Promise<T>,
    private start: number
  ) {
    super();
  }

  async next(): Promise<IteratorResult<T, any>> {
    return { done: false, value: await this.fn(this.start++) };
  }
}

class AsyncDelayedStream<T> extends AsyncStream<T> {
  constructor(private stream: AsyncStream<T>, private ms: number) {
    super();
  }

  async next(): Promise<IteratorResult<T, any>> {
    await new Promise((r) => setTimeout(r, this.ms));
    return this.stream.next();
  }
}

class SyncExtendStream<T> extends AsyncStream<T> {
  private streams: SyncStream<T>[];
  private index: number = 0;

  constructor(s1: SyncStream<T>, s2: SyncStream<T>) {
    super();
    this.streams = [s1, s2];
  }

  async next(): Promise<IteratorResult<T, any>> {
    while (1) {
      const current = this.streams[this.index];
      if (!current) return eos();
      const { done, value } = current.next();
      if (!done) return { done, value };
      this.index++;
    }
    throw Error("Impossible");
  }
}

class AsyncExtendStream<T> extends AsyncStream<T> {
  private streams: AsyncStream<T>[];
  private index: number = 0;

  constructor(s1: AsyncStream<T>, s2: AsyncStream<T>) {
    super();
    this.streams = [s1, s2];
  }

  async next(): Promise<IteratorResult<T, any>> {
    while (1) {
      const current = this.streams[this.index];
      if (!current) return eos();
      const { done, value } = await current.next();
      if (!done) return { done, value };
      this.index++;
    }
    throw Error("Impossible");
  }
}

class SyncMeasuringStream<T> extends SyncStream<[T, number]> {
  constructor(private stream: SyncStream<T>) {
    super();
  }

  next(): IteratorResult<[T, number], any> {
    const from = performance.now();
    const { done, value } = this.stream.next();
    if (done) return { done, value };
    return { done, value: [value, performance.now() - from] };
  }
}

class AsyncMeasuringStream<T> extends AsyncStream<[T, number]> {
  constructor(private stream: AsyncStream<T>) {
    super();
  }

  async next(): Promise<IteratorResult<[T, number], any>> {
    const from = performance.now();
    const { done, value } = await this.stream.next();
    if (done) return { done, value };
    return { done, value: [value, performance.now() - from] };
  }
}
