import { AsyncStream, SyncStream } from "./base";
import { AsyncBatchesStream, SyncBatchesStream } from "./combinators/batches";
import { AsyncDelayStream } from "./combinators/delay";
import { SyncExtendStream, AsyncExtendStream } from "./combinators/extend";
import { SyncFilterStream, AsyncFilterStream } from "./combinators/filter";
import { SyncFlatMapStream, AsyncFlatMapStream } from "./combinators/flatmap";
import { AsyncFlattenStream, SyncFlattenStream } from "./combinators/flatten";
import { SyncJoinStream, AsyncJoinStream } from "./combinators/join";
import { SyncMapStream, AsyncMapStream } from "./combinators/map";
import {
  AsyncMeasuredStream,
  SyncMeasuringStream,
} from "./combinators/measuring";
import { SyncIntoAsyncStreamAdapter } from "./combinators/sync-as-async";
import { AsyncThrottleStream } from "./combinators/throttle";
import { AsyncWhileStream, SyncWhileStream } from "./combinators/while";
import { AsyncWindowStream, SyncWindowStream } from "./combinators/window";
import {
  AnyItera,
  AnyOps,
  AnyStream,
  ExtendsOrNever,
  Promising,
  StreamItem,
} from "./types";

export class SyncStreamOps<T> extends SyncStream<T> {
  #stream;

  constructor(stream: SyncStream<T>) {
    super();
    this.#stream = stream;
  }

  /**
   * @param fn Transformer function
   * @returns A stream that transform every element of underlying stream using transformer function
   */
  map<T1>(fn: (a: T) => T1): SyncStreamOps<T1> {
    return new SyncStreamOps(new SyncMapStream(this, fn));
  }

  /**
   * @param fn Transformer function that returns iterable object
   * @returns A stream which parts will be computed using transformer function from the every element of underlying stream
   */
  flatMap<T1>(fn: (a: T) => Iterable<T1> | Iterator<T1>): SyncStreamOps<T1> {
    return new SyncStreamOps(new SyncFlatMapStream(this, fn));
  }

  /**
   * @param fn Preducate function
   * @returns A stream that yields only elements that match predicate function
   */
  filter(fn: (a: T) => boolean): SyncStreamOps<T> {
    return new SyncStreamOps(new SyncFilterStream(this, fn));
  }

  /**
   * @param obj Options object for configuring stream behaviour.
   * A skip field tells a stream to just consume `n` elements instead yielding them.
   * A take field tells a stream to yield `n` elements, then end a stream
   * @returns A stream which contains elements slice configured by `obj` argument
   */
  window({ skip, take }: { skip?: number; take?: number }): SyncStreamOps<T> {
    return new SyncStreamOps(new SyncWindowStream(this, skip, take));
  }

  /**
   * @param fn Function that perform actions to every element of stream
   */
  forEach(fn: (a: T) => any): void {
    while (1) {
      const item = this.nextItem();
      if ("done" in item) return;
      if ("error" in item) throw item.error;
      fn(item.value);
    }
  }

  /**
   * @param predicate Predicate function
   * @returns An synchronous stream which yields elements while predicate on every of them is truthy
   */
  takeWhile(predicate: (a: T) => boolean) {
    return new SyncStreamOps(
      new SyncWhileStream(this, "take-while", predicate)
    );
  }

  /**
   * @param predicate Predicate function
   * @returns An synchronous stream which drops elements while predicate on every of them is truthy, then yields the rest
   */
  dropWhile(predicate: (a: T) => boolean) {
    return new SyncStreamOps(
      new SyncWhileStream(this, "drop-while", predicate)
    );
  }

  #arrayOfStreamsIsSync(array: AnyStream<T>[]): array is SyncStream<T>[] {
    return !array.some((x) => !x.sync);
  }

  /**
   * @param other An another stream to be merged
   * @returns A stream which firstly yields all elements from underlying stream, then from `other` stream
   */
  extend(...others: SyncStream<T>[]): SyncStreamOps<T>;
  extend(...others: AnyStream<T>[]): AsyncStreamOps<T>;
  extend(...others: AnyStream<T>[]): AnyOps<T> {
    if (this.#arrayOfStreamsIsSync(others)) {
      return new SyncStreamOps(new SyncExtendStream(this, ...others));
    } else {
      return new AsyncStreamOps(
        new AsyncExtendStream(
          new SyncIntoAsyncStreamAdapter(this),
          ...others.map((x) => (x.sync ? new SyncIntoAsyncStreamAdapter(x) : x))
        )
      );
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
      if ("done" in item) return init;
      if ("error" in item) throw item.error;
      init = fn(item.value, init);
    }
    throw Error("Impossible");
  }

  /**
   * @returns A stream which yields a tuple of actual element and time in milliseconds it took to produce
   */
  measured(): SyncStreamOps<[T, number]> {
    return new SyncStreamOps(new SyncMeasuringStream(this));
  }

  /**
   * @returns Lifts underlying stream into asynchronous context
   */
  async(): AsyncStreamOps<T> {
    return new AsyncStreamOps(new SyncIntoAsyncStreamAdapter(this));
  }

  /**
   * Performs batch([1, 2, 3, 4], 2) -> [[1, 2], [3, 4]]
   * @param n Count of elements in every batch
   * @returns A stream which yields batches of elements of underlying stream
   */
  batches(n: number): SyncStreamOps<T[]> {
    return new SyncStreamOps(new SyncBatchesStream(this, n));
  }

  /**
   * @returns A first element of a stream. If stream is empty, returns null
   */
  first(): T | null {
    const item = this.nextItem();
    if ("done" in item) return null;
    if ("error" in item) throw item.error;
    return item.value;
  }

  /**
   * @returns A last element of a stream. If stream is empty, returns null
   */
  last(): T | null {
    let r: T | null = null;
    while (1) {
      const item = this.nextItem();
      if ("done" in item) break;
      if ("error" in item) throw item.error;
      r = item.value;
    }
    return r;
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while both streams does not exhausted
   */
  join<T1>(other: SyncStream<T1>) {
    return new SyncStreamOps(new SyncJoinStream(this, other, "inner-join"));
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while left stream does not exhausted
   */
  leftJoin<T1>(other: SyncStream<T1>) {
    return new SyncStreamOps(new SyncJoinStream(this, other, "left-join"));
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while right stream does not exhausted
   */
  rightJoin<T1>(other: SyncStream<T1>) {
    return new SyncStreamOps(new SyncJoinStream(this, other, "right-join"));
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while one of streams does not exhausted
   */
  fullJoin<T1>(other: SyncStream<T1>) {
    return new SyncStreamOps(new SyncJoinStream(this, other, "full-join"));
  }

  /**
   * @returns A stream that returns each element of each stream that returns the stream is passed as an argument
   */
  flatten<T, Self extends this>(
    this: ExtendsOrNever<SyncStream<SyncStream<any>>, Self>
  ): SyncStreamOps<T> {
    return new SyncStreamOps(new SyncFlattenStream(this));
  }

  /**
   * @returns An array of stream elements
   */
  collect(): T[] {
    const r = [];
    for (const x of this) r.push(x);
    return r;
  }

  /**
   * @returns A raw item of stream
   */
  nextItem(): StreamItem<T> {
    return this.#stream.nextItem();
  }
}

export class AsyncStreamOps<T> extends AsyncStream<T> {
  #stream;

  constructor(stream: AsyncStream<T>) {
    super();
    this.#stream = stream;
  }

  /**
   * @param fn Transformer function
   * @returns A stream that transform every element of underlying stream using transformer function
   */
  map<T1>(fn: (a: T) => Promising<T1>): AsyncStreamOps<T1> {
    return new AsyncStreamOps(new AsyncMapStream(this, fn));
  }

  /**
   * @param fn Transformer function that returns iterable object
   * @returns A stream which parts will be computed using transformer function from the every element of underlying stream
   */
  flatMap<T1>(fn: (a: T) => Promising<AnyItera<T1>>): AsyncStreamOps<T1> {
    return new AsyncStreamOps(new AsyncFlatMapStream(this, fn));
  }

  /**
   * @param fn Preducate function
   * @returns A stream that yields only elements that match predicate function
   */
  filter(fn: (a: T) => Promising<boolean>): AsyncStreamOps<T> {
    return new AsyncStreamOps(new AsyncFilterStream(this, fn));
  }

  /**
   * @param obj Options object for configuring stream behaviour.
   * A skip field tells a stream to just consume `n` elements instead yielding them.
   * A take field tells a stream to yield `n` elements, then end a stream
   * @returns A stream which contains elements slice configured by `obj` argument
   */
  window({ skip, take }: { skip?: number; take?: number }): AsyncStreamOps<T> {
    return new AsyncStreamOps(new AsyncWindowStream(this, skip, take));
  }

  /**
   * @param fn Function that perform actions to every element of stream
   * @returns A promise that will be resolved when all elements of stream will be exhausted
   */
  async forEach(fn: (a: T) => any): Promise<void> {
    while (1) {
      const item = await this.nextItem();
      if ("done" in item) return;
      if ("error" in item) throw item.error;
      await fn(item.value);
    }
  }

  /**
   * @param ms A timeout before requesting a yield from underlying stream
   * @returns An asynchronous stream that delay every yield by `ms` milliseconds
   */
  delayBefore(ms: number): AsyncStreamOps<T> {
    return new AsyncStreamOps(new AsyncDelayStream(this, "before-pull", ms));
  }

  /**
   * @param ms A timeout after requesting a yield from underlying stream
   * @returns An asynchronous stream that delay every yield by `ms` milliseconds
   */
  delayAfter(ms: number): AsyncStreamOps<T> {
    return new AsyncStreamOps(new AsyncDelayStream(this, "after-pull", ms));
  }

  /**
   * @param ms A timeout that represents a minimal time stream yield after
   * @returns An asynchronous stream that delay every yield by `ms` milliseconds
   */
  throttle(ms: number): AsyncStreamOps<T> {
    return new AsyncStreamOps(new AsyncThrottleStream(this, ms));
  }

  /**
   * @param predicate Predicate function
   * @returns An synchronous stream which yields elements while predicate on every of them is truthy
   */
  takeWhile(predicate: (a: T) => Promising<boolean>) {
    return new AsyncStreamOps(
      new AsyncWhileStream(this, "take-while", predicate)
    );
  }

  /**
   * @param predicate Predicate function
   * @returns An synchronous stream which drops elements while predicate on every of them is truthy, then yields the rest
   */
  dropWhile(predicate: (a: T) => Promising<boolean>) {
    return new AsyncStreamOps(
      new AsyncWhileStream(this, "drop-while", predicate)
    );
  }

  /**
   * @param other An another stream to be merged
   * @returns A stream which firstly yields all elements from underlying stream, then from `other` stream
   */
  extend(...others: AnyStream<T>[]): AsyncStreamOps<T> {
    return new AsyncStreamOps(
      new AsyncExtendStream(
        this,
        ...others.map((x) => (x.sync ? new SyncIntoAsyncStreamAdapter(x) : x))
      )
    );
  }

  /**
   * @param fn Reducing function
   * @param init Initial accumulator value
   * @returns Result of function that was applied to every stream element and using previous return as second argument
   */
  async reduce<R>(fn: (a: T, b: R) => Promising<R>, init: R): Promise<R> {
    while (1) {
      const item = await this.nextItem();
      if ("done" in item) return init;
      if ("error" in item) throw item.error;
      init = await fn(item.value, init);
    }
    throw Error("Impossible");
  }

  /**
   * @returns A stream which yields a tuple of actual element and time in milliseconds it took to produce
   */
  measured(): AsyncStreamOps<[T, number]> {
    return new AsyncStreamOps(new AsyncMeasuredStream(this));
  }

  /**
   * Performs batch([1, 2, 3, 4], 2) -> [[1, 2], [3, 4]]
   * @param n Count of elements in every batch
   * @returns A stream which yields batches of elements of underlying stream
   */
  batches(n: number): AsyncStreamOps<T[]> {
    return new AsyncStreamOps(new AsyncBatchesStream(this, n));
  }

  /**
   * @returns A first element of a stream. If stream is empty, returns null
   */
  async first(): Promise<T | null> {
    const item = await this.nextItem();
    if ("done" in item) return null;
    if ("error" in item) throw item.error;
    return item.value;
  }

  /**
   * @returns A last element of a stream. If stream is empty, returns null
   */
  async last(): Promise<T | null> {
    let r: T | null = null;
    while (1) {
      const item = await this.nextItem();
      if ("done" in item) break;
      if ("error" in item) throw item.error;
      r = item.value;
    }
    return r;
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while both streams does not exhausted
   */
  join<T1>(other: AsyncStream<T1>) {
    return new AsyncStreamOps(new AsyncJoinStream(this, other, "inner-join"));
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while left stream does not exhausted
   */
  leftJoin<T1>(other: AsyncStream<T1>) {
    return new AsyncStreamOps(new AsyncJoinStream(this, other, "left-join"));
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while right stream does not exhausted
   */
  rightJoin<T1>(other: AsyncStream<T1>) {
    return new AsyncStreamOps(new AsyncJoinStream(this, other, "right-join"));
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while one of streams does not exhausted
   */
  fullJoin<T1>(other: AsyncStream<T1>) {
    return new AsyncStreamOps(new AsyncJoinStream(this, other, "full-join"));
  }

  /**
   * @returns A stream that returns each element of each stream that returns the stream is passed as an argument
   */
  flatten<T, Self extends this>(
    this: ExtendsOrNever<AsyncStream<AnyStream<any>>, Self>
  ): AsyncStreamOps<T> {
    return new AsyncStreamOps(new AsyncFlattenStream(this));
  }

  /**
   * @returns An array of stream elements
   */
  async collect(): Promise<T[]> {
    const r = [];
    for await (const x of this) r.push(x);
    return r;
  }

  /**
   * @returns A raw item of stream
   */
  nextItem(): Promise<StreamItem<T>> {
    return this.#stream.nextItem();
  }
}
