import { AsyncStream, SyncStream } from "./base";
import { AsyncBatchesStream, SyncBatchesStream } from "./combinators/batches";
import { AsyncDelayedStream } from "./combinators/delayed";
import { SyncExtendStream, AsyncExtendStream } from "./combinators/extend";
import { SyncFilterStream, AsyncFilterStream } from "./combinators/filter";
import { SyncFlatMapStream, AsyncFlatMapStream } from "./combinators/flatmap";
import { SyncJoinStream, AsyncJoinStream } from "./combinators/join";
import { SyncMapStream, AsyncMapStream } from "./combinators/map";
import {
  AsyncMeasuredStream,
  SyncMeasuringStream,
} from "./combinators/measuring";
import { SyncIntoAsyncStreamAdapter } from "./combinators/sync-as-async";
import { AsyncWindowStream, SyncWindowStream } from "./combinators/window";
import {
  AnyItera,
  JoinStreamKind,
  JoinStreamReturnType,
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
   * @returns An asynchronous stream simular to SyncStream.map, but function returns promise instead of pure value
   */
  mapAsync<T1>(fn: (a: T) => Promise<T1>): AsyncStreamOps<T1> {
    return new AsyncStreamOps(
      new AsyncMapStream(new SyncIntoAsyncStreamAdapter(this), fn)
    );
  }

  /**
   *
   * @param fn Transformer function that returns iterable object
   * @returns A stream which parts will be computed using transformer function from the every element of underlying stream
   */
  flatMap<T1>(fn: (a: T) => Iterable<T1> | Iterator<T1>): SyncStreamOps<T1> {
    return new SyncStreamOps(new SyncFlatMapStream(this, fn));
  }

  /**
   * @returns An asynchronous stream simular to SyncStream.flatMap, but function returns promise instead of pure value
   */
  flatMapAsync<T1>(fn: (a: T) => Promise<AnyItera<T1>>): AsyncStreamOps<T1> {
    return new AsyncStreamOps(
      new AsyncFlatMapStream(new SyncIntoAsyncStreamAdapter(this), fn)
    );
  }

  /**
   * @param fn Preducate function
   * @returns A stream that yields only elements that match predicate function
   */
  filter(fn: (a: T) => boolean): SyncStreamOps<T> {
    return new SyncStreamOps(new SyncFilterStream(this, fn));
  }

  /**
   * @returns An asynchronous stream simular to SyncStream.filter, buf function returns promise instead of pure value
   */
  filterAsync(fn: (a: T) => Promise<boolean>): AsyncStreamOps<T> {
    return new AsyncStreamOps(
      new AsyncFilterStream(new SyncIntoAsyncStreamAdapter(this), fn)
    );
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
   * @returns Simular to SyncStream.forEach, but function returns promise, that will be awaited before continuing.
   * Returns a promise that will be resolved when all elements of stream will be exhausted
   */
  async forEachAsync(fn: (a: T) => Promise<any>): Promise<void> {
    while (1) {
      const item = this.nextItem();
      if ("done" in item) return;
      if ("error" in item) throw item.error;
      await fn(item.value);
    }
  }

  /**
   * @param ms A timeout before requesting a yield from underlying stream
   * @returns An asynchronous stream that delay every yield by `ms` milliseconds
   */
  delayed(ms: number): AsyncStreamOps<T> {
    return new AsyncStreamOps(
      new AsyncDelayedStream(new SyncIntoAsyncStreamAdapter(this), ms)
    );
  }

  /**
   * @param other An another stream to be merged
   * @returns A stream which firstly yields all elements from underlying stream, then from `other` stream
   */
  extend(other: SyncStreamOps<T>): SyncStreamOps<T>;
  extend(other: AsyncStreamOps<T>): AsyncStreamOps<T>;
  extend(other: any): any {
    if (other.sync) {
      return new SyncStreamOps(new SyncExtendStream(this, other));
    } else {
      return new AsyncStreamOps(
        new AsyncExtendStream(new SyncIntoAsyncStreamAdapter(this), other)
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
   * @returns A synchronous stream which acts as asynchronous stream
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
   * Think of it like SQL join, in that case it will be intuitive
   * @param other Other stream meant to be joined
   * @param kind Join kind, see its type
   */
  join<T1, K extends JoinStreamKind>(
    other: SyncStreamOps<T1>,
    join: K
  ): SyncStreamOps<JoinStreamReturnType<T, T1, K>>;
  join<T1, K extends JoinStreamKind>(
    other: AsyncStreamOps<T1>,
    join: K
  ): AsyncStreamOps<JoinStreamReturnType<T, T1, K>>;
  join(other: any, join: any): any {
    if (other.sync) {
      return new SyncStreamOps(new SyncJoinStream(this, other, join));
    } else {
      return new AsyncStreamOps(
        new AsyncJoinStream(new SyncIntoAsyncStreamAdapter(this), other, join)
      );
    }
  }

  collect(): T[] {
    const r = [];
    for (const x of this) r.push(x);
    return r;
  }

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
   * @returns A stream that transform every element of underlying stream using transformer function. If transformer function returns a promise, it will be resolved before yielding
   */
  map<T1>(fn: (a: T) => Promising<T1>): AsyncStreamOps<T1> {
    return new AsyncStreamOps(new AsyncMapStream(this, fn));
  }

  /**
   * @param fn Transformer function that returns iterable object
   * @returns A stream which parts will be computed using transformer function from the every element of underlying stream. If transformer function returns a promise, it will be resolved before yielding
   */
  flatMap<T1>(fn: (a: T) => Promising<AnyItera<T1>>): AsyncStreamOps<T1> {
    return new AsyncStreamOps(new AsyncFlatMapStream(this, fn));
  }

  /**
   * @param fn Preducate function
   * @returns A stream that yields only elements that match predicate function. If transformer function returns a promise, it will be resolved before yielding
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
   * @param fn Function that perform actions to every element of stream.
   * @returns A promise that will be resolved when all elements of stream will be exhausted
   */
  async forEach(fn: (a: T) => any): Promise<void> {
    while (1) {
      const item = await this.nextItem();
      if ("done" in item) return;
      if ("error" in item) throw item.error;
      fn(item.value);
    }
  }

  /**
   * @returns Simular to AsyncStream.forEach, but function returns promise, that will be awaited before continuing.
   * Returns a promise that will be resolved when all elements of stream will be exhausted
   */
  async forEachAsync(fn: (a: T) => Promise<any>): Promise<void> {
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
  delayed(ms: number): AsyncStreamOps<T> {
    return new AsyncStreamOps(new AsyncDelayedStream(this, ms));
  }

  /**
   * @param other An another stream to be merged
   * @returns A stream which firstly yields all elements from underlying stream, then from `other` stream
   */
  extend(other: SyncStream<T> | AsyncStream<T>): AsyncStreamOps<T> {
    return new AsyncStreamOps(
      new AsyncExtendStream(
        this,
        other.sync ? new SyncIntoAsyncStreamAdapter(other) : other
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
   * Think of it like SQL join, in that case it will be intuitive
   * @param other Other stream meant to be joined
   * @param kind Join kind, see its type
   */
  join<T1, K extends JoinStreamKind>(
    other: SyncStream<T1> | AsyncStreamOps<T1>,
    kind: K
  ): AsyncStreamOps<JoinStreamReturnType<T, T1, K>> {
    return new AsyncStreamOps(
      new AsyncJoinStream(
        this,
        other.sync ? new SyncIntoAsyncStreamAdapter(other) : other,
        kind
      )
    );
  }

  async collect(): Promise<T[]> {
    const r = [];
    for await (const x of this) r.push(x);
    return r;
  }

  nextItem(): Promise<StreamItem<T>> {
    return this.#stream.nextItem();
  }
}
