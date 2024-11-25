import { AsyncBatchesStream, SyncBatchesStream } from "./combinators/batches";
import { AsyncDelayedStream } from "./combinators/delayed";
import { AsyncExtendStream, SyncExtendStream } from "./combinators/extend";
import { SyncFailStream } from "./combinators/fail";
import { AsyncFilterStream, SyncFilterStream } from "./combinators/filter";
import { AsyncFlatMapStream, SyncFlatMapStream } from "./combinators/flatmap";
import { AsyncFlattenStream, SyncFlattenStream } from "./combinators/flatten";
import {
  AsyncIterableStream,
  SyncIterableStream,
} from "./combinators/from-iterator";
import { GatherIterableStream } from "./combinators/gather";
import { AsyncIterateStream, SyncIterateStream } from "./combinators/iterate";
import {
  AsyncIntoIteratorStreamAdapter,
  SyncIntoIteratorStreamAdapter,
} from "./combinators/iterator";
import { AsyncMapStream, SyncMapStream } from "./combinators/map";
import {
  AsyncMeasuredStream,
  SyncMeasuringStream,
} from "./combinators/measuring";
import { SyncIntoAsyncStreamAdapter } from "./combinators/sync-as-async";
import { AsyncWindowStream, SyncWindowStream } from "./combinators/window";
import {
  SyncZipStream as SyncJoinStream,
  AsyncZipStream as AsyncJoinStream,
} from "./combinators/join";
import {
  AnyItera,
  StreamItem,
  JoinStreamKind,
  JoinStreamReturnType,
} from "./types";
import { intoIter } from "./utils";

export abstract class Stream<S> {
  constructor(readonly sync: S) {}

  /**
   * @param error An error that will be returned after requesting the item
   * @returns A stream that always fails. Similar to throwing an exception when processing the first element
   */
  static fail<T>(error: unknown): SyncStream<T> {
    return new SyncFailStream(error);
  }

  /**
   * @param it Iterable on the basis of which a stream will be built
   * @returns A stream that yields iterable items synchronously
   */
  static sync<T>(it: Iterable<T> | Iterator<T>): SyncStream<T> {
    return new SyncIterableStream(
      Symbol.iterator in it ? it[Symbol.iterator]() : it
    );
  }

  /**
   * @param it Simular to Stream.sync, async iterable on the basis of which a stream will be built
   * @returns A stream that yields iterable items asynchronously
   */
  static async<T>(it: AsyncIterable<T> | AsyncIterator<T>): AsyncStream<T> {
    return new AsyncIterableStream(
      Symbol.asyncIterator in it ? it[Symbol.asyncIterator]() : it
    );
  }

  /**
   * @param it Simular to Stream.sync/async, sync/async iterable that contains promises
   * @returns A stream that yields promises result preserving its order
   */
  static gather<T>(it: AnyItera<Promise<T>>): AsyncStream<T> {
    return new GatherIterableStream(intoIter(it));
  }

  /**
   * @param it Stream of streams
   * @returns A stream that returns each element of each stream that returns the stream is passed as an argument
   */
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

  /**
   * @param start The value of the first element that stream yields
   * @returns An infinite stream that yield items, each subsequent one of which is greater than the previous one by 1
   */
  static count(start?: number): SyncStream<number> {
    return this.iterate((x) => x, start);
  }

  /**
   * @returns An infinite stream that can be represented as optimized variant of Stream.count(start).map(fn)
   */
  static iterate<T>(fn: (a: number) => T, start?: number): SyncStream<T> {
    return new SyncIterateStream(fn, start ?? 0);
  }

  /**
   * @returns An asynchronous stream simular to Stream.iterate, but function returns promise instead of pure value
   */
  static iterateAsync<T>(
    fn: (a: number) => Promise<T>,
    start: number = 0
  ): AsyncStream<T> {
    return new AsyncIterateStream(fn, start);
  }
}

export abstract class SyncStream<T> extends Stream<true> {
  constructor() {
    super(true);
  }

  /**
   * @param fn Transformer function
   * @returns A stream that transform every element of underlying stream using transformer function
   */
  map<T1>(fn: (a: T) => T1): SyncStream<T1> {
    return new SyncMapStream(this, fn);
  }

  /**
   * @returns An asynchronous stream simular to SyncStream.map, but function returns promise instead of pure value
   */
  mapAsync<T1>(fn: (a: T) => Promise<T1>): AsyncStream<T1> {
    return new AsyncMapStream(this.intoAsync(), fn);
  }

  /**
   *
   * @param fn Transformer function that returns iterable object
   * @returns A stream which parts will be computed using transformer function from the every element of underlying stream
   */
  flatMap<T1>(fn: (a: T) => Iterable<T1> | Iterator<T1>): SyncStream<T1> {
    return new SyncFlatMapStream(this, fn);
  }

  /**
   * @returns An asynchronous stream simular to SyncStream.flatMap, but function returns promise instead of pure value
   */
  flatMapAsync<T1>(
    fn: (a: T) => AnyItera<T1> | Promise<AnyItera<T1>>
  ): AsyncStream<T1> {
    return new AsyncFlatMapStream(this.intoAsync(), fn);
  }

  /**
   * @param fn Preducate function
   * @returns A stream that yields only elements that match predicate function
   */
  filter(fn: (a: T) => boolean): SyncStream<T> {
    return new SyncFilterStream(this, fn);
  }

  /**
   * @returns An asynchronous stream simular to SyncStream.filter, buf function returns promise instead of pure value
   */
  filterAsync(fn: (a: T) => Promise<boolean>): AsyncStream<T> {
    return new AsyncFilterStream(this.intoAsync(), fn);
  }

  /**
   * @param obj Options object for configuring stream behaviour.
   * A skip field tells a stream to just consume `n` elements instead yielding them.
   * A take field tells a stream to yield `n` elements, then end a stream
   * @returns A stream which contains elements slice configured by `obj` argument
   */
  window({ skip, take }: { skip?: number; take?: number }): SyncStream<T> {
    return new SyncWindowStream(this, skip, take);
  }

  /**
   * @param fn Function that perform actions to every element of stream
   */
  forEach(fn: (a: T) => any): void {
    while (1) {
      const item = this.nextItem();
      if ("d" in item) return;
      if ("e" in item) throw item.e;
      fn(item.i);
    }
  }

  /**
   * @param ms A timeout before requesting a yield from underlying stream
   * @returns An asynchronous stream that delay every yield by `ms` milliseconds
   */
  delayed(ms: number): AsyncStream<T> {
    return new AsyncDelayedStream(this.intoAsync(), ms);
  }

  /**
   * @param other An another stream to be merged
   * @returns A stream which firstly yields all elements from underlying stream, then from `other` stream
   */
  extend(other: SyncStream<T>): SyncStream<T>;
  extend(other: AsyncStream<T>): AsyncStream<T>;
  extend(other: any): any {
    if (other.sync) {
      return new SyncExtendStream(this, other);
    } else {
      return new AsyncExtendStream(this.intoAsync(), other);
    }
  }

  /**
   * @param fn Reducing function
   * @param init Initial accumulator value
   * @returns Result of function that was applied to every stream element and using previous return as second argument
   */
  reduce<R>(fn: (a: T, b: R) => R, init: R): R {
    while (1) {
      const item = this.nextItem();
      if ("d" in item) return init;
      if ("e" in item) throw item.e;
      init = fn(item.i, init);
    }
    throw Error("Impossible");
  }

  /**
   * @returns A stream which yields a tuple of actual element and time in milliseconds it took to produce
   */
  measured(): SyncStream<[T, number]> {
    return new SyncMeasuringStream(this);
  }

  /**
   * @returns A synchronous stream which acts as asynchronously stream
   */
  intoAsync(): AsyncStream<T> {
    return new SyncIntoAsyncStreamAdapter(this);
  }

  /**
   * @returns An iterator that yields all stream elements
   */
  iterator(): Iterable<T> & Iterator<T> {
    return new SyncIntoIteratorStreamAdapter(this);
  }

  /**
   * Performs batch([1, 2, 3, 4], 2) -> [[1, 2], [3, 4]]
   * @param n Count of elements in every batch
   * @returns A stream which yields batches of elements of underlying stream
   */
  batches(n: number): SyncStream<T[]> {
    return new SyncBatchesStream(this, n);
  }

  /**
   * @returns A first element of a stream. If stream is empty, returns null
   */
  first(): T | null {
    const item = this.nextItem();
    if ("d" in item) return null;
    if ("e" in item) throw item.e;
    return item.i;
  }

  /**
   * @returns A last element of a stream. If stream is empty, returns null
   */
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

  /**
   * Think of it like SQL join, in that case it will be intuitive
   * @param other Other stream meant to be joined
   * @param kind Join kind, see its type
   */
  join<T1, K extends JoinStreamKind>(
    other: SyncStream<T1>,
    join: K
  ): SyncStream<JoinStreamReturnType<T, T1, K>>;
  join<T1, K extends JoinStreamKind>(
    other: AsyncStream<T1>,
    join: K
  ): AsyncStream<JoinStreamReturnType<T, T1, K>>;
  join(other: any, join: any): any {
    if (other.sync) {
      return new SyncJoinStream(this, other, join);
    } else {
      return new AsyncJoinStream(this.intoAsync(), other, join);
    }
  }

  abstract nextItem(): StreamItem<T>;
}

export abstract class AsyncStream<T> extends Stream<false> {
  constructor() {
    super(false);
  }

  /**
   * @param fn Transformer function
   * @returns A stream that transform every element of underlying stream using transformer function. If transformer function returns a promise, it will be resolved before yielding
   */
  map<T1>(fn: (a: T) => T1 | Promise<T1>): AsyncStream<T1> {
    return new AsyncMapStream(this, fn);
  }

  /**
   * @param fn Transformer function that returns iterable object
   * @returns A stream which parts will be computed using transformer function from the every element of underlying stream. If transformer function returns a promise, it will be resolved before yielding
   */
  flatMap<T1>(
    fn: (a: T) => AnyItera<T1> | Promise<AnyItera<T1>>
  ): AsyncStream<T1> {
    return new AsyncFlatMapStream(this, fn);
  }

  /**
   * @param fn Preducate function
   * @returns A stream that yields only elements that match predicate function. If transformer function returns a promise, it will be resolved before yielding
   */
  filter(fn: (a: T) => boolean | Promise<boolean>): AsyncStream<T> {
    return new AsyncFilterStream(this, fn);
  }

  /**
   * @param obj Options object for configuring stream behaviour.
   * A skip field tells a stream to just consume `n` elements instead yielding them.
   * A take field tells a stream to yield `n` elements, then end a stream
   * @returns A stream which contains elements slice configured by `obj` argument
   */
  window(skip: number, take: number): AsyncStream<T> {
    return new AsyncWindowStream(this, skip, take);
  }

  /**
   * @param fn Function that perform actions to every element of stream.
   * @returns A promise that will be resolved when all elements of stream will be exhausted
   */
  async forEach(fn: (a: T) => any): Promise<void> {
    while (1) {
      const item = await this.nextItem();
      if ("d" in item) return;
      if ("e" in item) throw item.e;
      await fn(item.i);
    }
  }

  /**
   * @returns Simular to AsyncStream.forEach, but function returns promise, that will be awaited before continuing.
   * Returns a promise that will be resolved when all elements of stream will be exhausted
   */
  async forEachAsync(fn: (a: T) => Promise<any>): Promise<void> {
    while (1) {
      const item = await this.nextItem();
      if ("d" in item) return;
      if ("e" in item) throw item.e;
      await fn(item.i);
    }
  }

  /**
   * @param ms A timeout before requesting a yield from underlying stream
   * @returns An asynchronous stream that delay every yield by `ms` milliseconds
   */
  delayed(ms: number): AsyncStream<T> {
    return new AsyncDelayedStream(this, ms);
  }

  /**
   * @param other An another stream to be merged
   * @returns A stream which firstly yields all elements from underlying stream, then from `other` stream
   */
  extend(other: SyncStream<T> | AsyncStream<T>): AsyncStream<T> {
    return new AsyncExtendStream(this, other.sync ? other.intoAsync() : other);
  }

  /**
   * @param fn Reducing function
   * @param init Initial accumulator value
   * @returns Result of function that was applied to every stream element and using previous return as second argument
   */
  async reduce<R>(fn: (a: T, b: R) => R | Promise<R>, init: R): Promise<R> {
    while (1) {
      const item = await this.nextItem();
      if ("d" in item) return init;
      if ("e" in item) throw item.e;
      init = await fn(item.i, init);
    }
    throw Error("Impossible");
  }

  /**
   * @returns A stream which yields a tuple of actual element and time in milliseconds it took to produce
   */
  measured(): AsyncStream<[T, number]> {
    return new AsyncMeasuredStream(this);
  }

  /**
   * @returns An iterator that yields all stream elements
   */
  iterator(): AsyncIterable<T> & AsyncIterator<T> {
    return new AsyncIntoIteratorStreamAdapter(this);
  }

  /**
   * Performs batch([1, 2, 3, 4], 2) -> [[1, 2], [3, 4]]
   * @param n Count of elements in every batch
   * @returns A stream which yields batches of elements of underlying stream
   */
  batches(n: number): AsyncStream<T[]> {
    return new AsyncBatchesStream(this, n);
  }

  /**
   * @returns A first element of a stream. If stream is empty, returns null
   */
  async first(): Promise<T | null> {
    const item = await this.nextItem();
    if ("d" in item) return null;
    if ("e" in item) throw item.e;
    return item.i;
  }

  /**
   * @returns A last element of a stream. If stream is empty, returns null
   */
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

  /**
   * Think of it like SQL join, in that case it will be intuitive
   * @param other Other stream meant to be joined
   * @param kind Join kind, see its type
   */
  join<T1, K extends JoinStreamKind>(
    other: SyncStream<T1> | AsyncStream<T1>,
    kind: K
  ): AsyncStream<JoinStreamReturnType<T, T1, K>> {
    return new AsyncJoinStream(
      this,
      other.sync ? other.intoAsync() : other,
      kind
    );
  }

  abstract nextItem(): Promise<StreamItem<T>>;
}
