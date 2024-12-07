import { AsyncStream, SyncStream } from "./base";
import { AsyncAttemptStream, SyncAttemptStream } from "./combinators/attempt";
import { AsyncBatchesStream, SyncBatchesStream } from "./combinators/batches";
import { AsyncDelayStream } from "./combinators/delay";
import { SyncExtendStream, AsyncExtendStream } from "./combinators/extend";
import { SyncFilterStream, AsyncFilterStream } from "./combinators/filter";
import { SyncFlatMapStream, AsyncFlatMapStream } from "./combinators/flatmap";
import { AsyncFlattenStream, SyncFlattenStream } from "./combinators/flatten";
import { SyncJoinStream, AsyncJoinStream } from "./combinators/join";
import { SyncMapStream, AsyncMapStream } from "./combinators/map";
import { AsyncMeasureStream, SyncMeasureStream } from "./combinators/measure";
import { SyncIntoAsyncStreamAdapter } from "./combinators/sync-as-async";
import { AsyncThrottleStream } from "./combinators/throttle";
import { AsyncWhileStream, SyncWhileStream } from "./combinators/while";
import { AsyncWindowStream, SyncWindowStream } from "./combinators/window";
import {
  AnyItera,
  AnyStream,
  CollectOptions,
  CollectReturnType,
  CollectReturnTypeWithErrorsIf,
  Either,
  Promising,
  StreamItem,
  SyncItera,
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
  flatMap<T1>(fn: (a: T) => SyncItera<T1>): SyncStreamOps<T1> {
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
   * @param amount Tells amount of elements to yield, then signal end-of-stream
   * @returns A stream with first `<= amount` elements
   */
  take(amount: number): SyncStreamOps<T> {
    return new SyncStreamOps(new SyncWindowStream(this, "take", amount));
  }

  /**
   * @param amount Tells amount of elements to skip, then yield the rest
   * @returns A stream with last `Math.max(streamLength - amount, 0)` elements
   */
  skip(amount: number): SyncStreamOps<T> {
    return new SyncStreamOps(new SyncWindowStream(this, "skip", amount));
  }

  /**
   * @param fn Function that perform actions to every element of stream
   */
  each(fn: (a: T) => void): void {
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
  takeWhile(predicate: (a: T) => boolean): SyncStreamOps<T> {
    return new SyncStreamOps(
      new SyncWhileStream(this, "take-while", predicate)
    );
  }

  /**
   * @param predicate Predicate function
   * @returns An synchronous stream which drops elements while predicate on every of them is truthy, then yields the rest
   */
  dropWhile(predicate: (a: T) => boolean): SyncStreamOps<T> {
    return new SyncStreamOps(
      new SyncWhileStream(this, "drop-while", predicate)
    );
  }

  /**
   * @param other An another stream to be merged
   * @returns A stream which firstly yields all elements from underlying stream, then from `other` stream
   */
  extend(...others: SyncStream<T>[]): SyncStreamOps<T> {
    return new SyncStreamOps(new SyncExtendStream(this, ...others));
  }

  /**
   * @param fn Reducing function
   * @returns Result of function that was applied to every stream element and using previous return as first argument
   */
  reduce(fn: (a: T, b: T) => T): T {
    const head = this.head();
    if (head === null) throw Error("Stream is empty");
    while (1) {
      const item = head[1].nextItem();
      if ("done" in item) return head[0];
      if ("error" in item) throw item.error;
      head[0] = fn(head[0], item.value);
    }
    throw Error("Impossible");
  }

  /**
   * @param fn Reducing function
   * @param init Initial accumulator value
   * @returns Result of function that was applied to every stream element and using previous return as first argumentа
   */
  fold<R>(fn: (a: R, b: T) => R, init: R): R {
    while (1) {
      const item = this.nextItem();
      if ("done" in item) return init;
      if ("error" in item) throw item.error;
      init = fn(init, item.value);
    }
    throw Error("Impossible");
  }

  /**
   * @returns A stream which yields a tuple of actual element and time in milliseconds it took to produce
   */
  measure(): SyncStreamOps<[T, number]> {
    return new SyncStreamOps(new SyncMeasureStream(this));
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
   * @returns A first element of a stream and rest of stream. If stream is empty, returns null
   */
  head(): [T, this] | null {
    const item = this.nextItem();
    if ("done" in item) return null;
    if ("error" in item) throw item.error;
    return [item.value, this];
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
  join<T1>(other: SyncStream<T1>): SyncStreamOps<[T, T1]> {
    return new SyncStreamOps(new SyncJoinStream(this, other, "inner-join"));
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while left stream does not exhausted
   */
  leftJoin<T1>(other: SyncStream<T1>): SyncStreamOps<[T, T1 | null]> {
    return new SyncStreamOps(new SyncJoinStream(this, other, "left-join"));
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while right stream does not exhausted
   */
  rightJoin<T1>(other: SyncStream<T1>): SyncStreamOps<[T | null, T1]> {
    return new SyncStreamOps(new SyncJoinStream(this, other, "right-join"));
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while one of streams does not exhausted
   */
  fullJoin<T1>(
    other: SyncStream<T1>
  ): SyncStreamOps<[T, T1] | [T, null] | [null, T1]> {
    return new SyncStreamOps(new SyncJoinStream(this, other, "full-join"));
  }

  /**
   * @returns A stream that returns each element of each stream that returns the stream is passed as an argument
   */
  flatten<T>(
    this: this extends SyncStream<SyncStream<T>> ? this : never
  ): SyncStreamOps<T> {
    return new SyncStreamOps(new SyncFlattenStream(this));
  }

  /**
   * @returns Sum of all elements in numeric stream
   */
  sum(this: this extends SyncStreamOps<number> ? this : never): number {
    return this.fold((a, b) => a + b, 0);
  }

  /**
   * @returns Minimum of all elements in numeric stream
   */
  min(this: this extends SyncStreamOps<number> ? this : never): number {
    return this.reduce(Math.min);
  }

  /**
   * @returns Maximum of all elements in numeric stream
   */
  max(this: this extends SyncStreamOps<number> ? this : never): number {
    return this.reduce(Math.min);
  }

  /**
   * @returns Mean of all elements in numeric stream
   */
  mean(this: this extends SyncStreamOps<number> ? this : never): number {
    const head = this.head();
    if (head === null) throw Error("Stream is empty");
    const [sum, count] = head[1].fold(
      ([a, count], b) => [a + b, count + 1],
      [head[0], 1]
    );
    return sum / count;
  }

  /**
   * @param fn Predicate function
   * @returns True if any of stream elements matches predicate
   */
  some(fn: (a: T) => boolean): boolean {
    while (1) {
      const item = this.nextItem();
      if ("error" in item) throw item.error;
      if ("done" in item) return false;
      if (fn(item.value)) return true;
    }
    throw Error("Impossible");
  }

  /**
   * @param fn Predicate function
   * @returns True if all of stream elements matches predicate
   */
  every(fn: (a: T) => boolean): boolean {
    while (1) {
      const item = this.nextItem();
      if ("error" in item) throw item.error;
      if ("done" in item) return true;
      if (!fn(item.value)) return false;
    }
    throw Error("Impossible");
  }

  /**
   * @returns A stream, with errors put to userspace
   */
  attempt(): SyncStreamOps<Either<unknown, T>> {
    return new SyncStreamOps(new SyncAttemptStream(this));
  }

  /**
   * @param options An options for configuring output
   *
   * If `errors: true`, then instead of `T[]`, `Either<unknown, T>[]` will be returned
   *
   * If `meanTime: true`, then instead `T[]`, `[T[], number]` will be returned
   * @returns Output according to options
   */
  collect<E extends boolean = false, M extends boolean = false>(
    options?: CollectOptions<E, M>
  ): CollectReturnType<T, E, M> {
    if (!options) {
      const result = [] as T[];
      while (1) {
        const item = this.next();
        if (item.done ?? false) break;
        result.push(item.value);
      }
      return result as CollectReturnType<T, E, M>;
    }
    const that = options.errors ?? false ? this.attempt() : this;
    if (options.meanTime ?? false) {
      const [result, elapsed, total] = that.measure().fold(
        ([result, elapsed, total], [element, currentElapsed]) => {
          result.push(element as CollectReturnTypeWithErrorsIf<T, E>);
          return [result, elapsed + currentElapsed, total + 1];
        },
        [[], 0, 0] as [CollectReturnTypeWithErrorsIf<T, E>[], number, number]
      );
      return [result, elapsed / total] as CollectReturnType<T, E, M>;
    }
    return that.collect() as CollectReturnType<T, E, M>;
  }

  /**
   * @returns Mean execution time (in ms) taken for every stream element
   */
  meanExecutionTime(): number {
    return this.measure()
      .map(([, x]) => x)
      .mean();
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
  flatMap<T1>(
    this: this extends AsyncStream<AnyItera<T1>> ? this : never
  ): AsyncStreamOps<T1>;
  flatMap<T1>(fn: (a: T) => Promising<AnyItera<T1>>): AsyncStreamOps<T1>;
  flatMap<T1>(fn?: (a: T) => Promising<AnyItera<T1>>): AsyncStreamOps<T1> {
    return new AsyncStreamOps(
      new AsyncFlatMapStream(
        this,
        (fn ?? ((x) => x)) as (a: T) => Promising<AnyItera<T1>>
      )
    );
  }

  /**
   * @param fn Preducate function
   * @returns A stream that yields only elements that match predicate function
   */
  filter(fn: (a: T) => Promising<boolean>): AsyncStreamOps<T> {
    return new AsyncStreamOps(new AsyncFilterStream(this, fn));
  }

  /**
   * @param amount Tells amount of elements to yield, then signal end-of-stream
   * @returns A stream with first `<= amount` elements
   */
  take(amount: number): AsyncStreamOps<T> {
    return new AsyncStreamOps(new AsyncWindowStream(this, "take", amount));
  }

  /**
   * @param amount Tells amount of elements to skip, then yield the rest
   * @returns A stream with last `Math.max(streamLength - amount, 0)` elements
   */
  skip(amount: number): AsyncStreamOps<T> {
    return new AsyncStreamOps(new AsyncWindowStream(this, "skip", amount));
  }

  /**
   * @param fn Function that perform actions to every element of stream
   * @returns A promise that will be resolved when all elements of stream will be exhausted
   */
  async each(fn: (a: T) => Promising<void>): Promise<void> {
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
  takeWhile(predicate: (a: T) => Promising<boolean>): AsyncStreamOps<T> {
    return new AsyncStreamOps(
      new AsyncWhileStream(this, "take-while", predicate)
    );
  }

  /**
   * @param predicate Predicate function
   * @returns An synchronous stream which drops elements while predicate on every of them is truthy, then yields the rest
   */
  dropWhile(predicate: (a: T) => Promising<boolean>): AsyncStreamOps<T> {
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
   * @returns Result of function that was applied to every stream element and using previous return as first argument
   */
  async reduce(fn: (a: T, b: T) => Promising<T>): Promise<T> {
    const head = await this.head();
    if (head === null) throw Error("Stream is empty");
    while (1) {
      const item = await head[1].nextItem();
      if ("done" in item) return head[0];
      if ("error" in item) throw item.error;
      head[0] = await fn(head[0], item.value);
    }
    throw Error("Impossible");
  }

  /**
   * @param fn Reducing function
   * @param init Initial accumulator value
   * @returns Result of function that was applied to every stream element and using previous return as first argumentа
   */
  async fold<R>(fn: (a: R, b: T) => Promising<R>, init: R): Promise<R> {
    while (1) {
      const item = await this.nextItem();
      if ("done" in item) return init;
      if ("error" in item) throw item.error;
      init = await fn(init, item.value);
    }
    throw Error("Impossible");
  }

  /**
   * @returns A stream which yields a tuple of actual element and time in milliseconds it took to produce
   */
  measure(): AsyncStreamOps<[T, number]> {
    return new AsyncStreamOps(new AsyncMeasureStream(this));
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
   * @returns A first element of a stream and rest of stream. If stream is empty, returns null
   */
  async head(): Promise<[T, this] | null> {
    const item = await this.nextItem();
    if ("done" in item) return null;
    if ("error" in item) throw item.error;
    return [item.value, this];
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
  join<T1>(other: AsyncStream<T1>): AsyncStreamOps<[T, T1]> {
    return new AsyncStreamOps(new AsyncJoinStream(this, other, "inner-join"));
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while left stream does not exhausted
   */
  leftJoin<T1>(other: AsyncStream<T1>): AsyncStreamOps<[T, T1 | null]> {
    return new AsyncStreamOps(new AsyncJoinStream(this, other, "left-join"));
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while right stream does not exhausted
   */
  rightJoin<T1>(other: AsyncStream<T1>): AsyncStreamOps<[T | null, T1]> {
    return new AsyncStreamOps(new AsyncJoinStream(this, other, "right-join"));
  }

  /**
   * @param other Other stream meant to be joined
   * @returns A Stream<[T, T1]> which will yield elements while one of streams does not exhausted
   */
  fullJoin<T1>(
    other: AsyncStream<T1>
  ): AsyncStreamOps<[T, T1] | [T, null] | [null, T1]> {
    return new AsyncStreamOps(new AsyncJoinStream(this, other, "full-join"));
  }

  /**
   * @returns A stream that returns each element of each stream that returns the stream is passed as an argument
   */
  flatten<T>(
    this: this extends AsyncStream<AnyStream<T>> ? this : never
  ): AsyncStreamOps<T> {
    return new AsyncStreamOps(new AsyncFlattenStream(this));
  }

  /**
   * @returns Sum of all elements in numeric stream
   */
  sum(
    this: this extends AsyncStreamOps<number> ? this : never
  ): Promise<number> {
    return this.fold((a, b) => a + b, 0);
  }

  /**
   * @returns Minimum of all elements in numeric stream
   */
  min(
    this: this extends AsyncStreamOps<number> ? this : never
  ): Promise<number> {
    return this.reduce(Math.min);
  }

  /**
   * @returns Maximum of all elements in numeric stream
   */
  max(
    this: this extends AsyncStreamOps<number> ? this : never
  ): Promise<number> {
    return this.reduce(Math.min);
  }

  /**
   * @returns Mean of all elements in numeric stream
   */
  async mean(
    this: this extends AsyncStreamOps<number> ? this : never
  ): Promise<number> {
    const head = await this.head();
    if (head === null) throw Error("Stream is empty");
    const [sum, count] = await head[1].fold(
      ([a, count], b) => [a + b, count + 1],
      [head[0], 1]
    );
    return sum / count;
  }

  /**
   * @param fn Predicate function
   * @returns True if any of stream elements matches predicate
   */
  async some(fn: (a: T) => Promising<boolean>): Promise<boolean> {
    while (1) {
      const item = await this.nextItem();
      if ("error" in item) throw item.error;
      if ("done" in item) return false;
      if (await fn(item.value)) return true;
    }
    throw Error("Impossible");
  }

  /**
   * @param fn Predicate function
   * @returns True if all of stream elements matches predicate
   */
  async every(fn: (a: T) => Promising<boolean>): Promise<boolean> {
    while (1) {
      const item = await this.nextItem();
      if ("error" in item) throw item.error;
      if ("done" in item) return true;
      if (!(await fn(item.value))) return false;
    }
    throw Error("Impossible");
  }

  /**
   * @returns A stream, with errors put to userspace
   */
  attempt(): AsyncStreamOps<Either<unknown, T>> {
    return new AsyncStreamOps(new AsyncAttemptStream(this));
  }

  /**
   * @returns Mean execution time (in ms) taken for every stream element
   */
  meanExecutionTime(): Promise<number> {
    return this.measure()
      .map(([, x]) => x)
      .mean();
  }

  /**
   * @param options An options for configuring output
   *
   * If `errors: true`, then instead of `T[]`, `Either<unknown, T>[]` will be returned
   *
   * If `meanTime: true`, then instead `T[]`, `[T[], number]` will be returned
   * @returns Output according to options
   */
  async collect<E extends boolean = false, M extends boolean = false>(
    options?: CollectOptions<E, M>
  ): Promise<CollectReturnType<T, E, M>> {
    if (!options) {
      const result = [] as T[];
      while (1) {
        const item = await this.next();
        if (item.done ?? false) break;
        result.push(item.value);
      }
      return result as CollectReturnType<T, E, M>;
    }
    const that = options.errors ?? false ? this.attempt() : this;
    if (options.meanTime ?? false) {
      const [result, elapsed, total] = await that.measure().fold(
        ([result, elapsed, total], [element, currentElapsed]) => {
          result.push(element as CollectReturnTypeWithErrorsIf<T, E>);
          return [result, elapsed + currentElapsed, total + 1];
        },
        [[], 0, 0] as [CollectReturnTypeWithErrorsIf<T, E>[], number, number]
      );
      return [result, elapsed / total] as CollectReturnType<T, E, M>;
    }
    return (await that.collect()) as CollectReturnType<T, E, M>;
  }

  /**
   * @returns A raw item of stream
   */
  nextItem(): Promise<StreamItem<T>> {
    return this.#stream.nextItem();
  }
}
