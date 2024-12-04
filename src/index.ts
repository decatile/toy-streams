import { SyncStream, AsyncStream } from "./base";
import { SyncFailStream } from "./combinators/fail";
import {
  SyncIterableStream,
  AsyncIterableStream,
} from "./combinators/from-iterator";
import { GatherIterableStream } from "./combinators/gather";
import { SyncIterateStream, AsyncIterateStream } from "./combinators/iterate";
import { AsyncStreamOps, SyncStreamOps } from "./ops";
import { AnyItera, AnyOps, AnyStream, AsyncItera, Promising, StreamItem, SyncItera } from "./types";
import { cancelStream, intoIter } from "./utils";

export {
  cancelStream,
  SyncStream,
  AsyncStream,
  SyncStreamOps,
  AsyncStreamOps,
  StreamItem,
};

export class Stream {
  /**
   * @param error An error that will be returned after requesting the item
   * @returns A stream that always fails. Similar to throwing an exception when processing the first element
   */
  static fail<T>(error: unknown): SyncStreamOps<T> {
    return new SyncStreamOps(new SyncFailStream(error));
  }

  /**
   * @param it Iterable on the basis of which a stream will be built
   * @returns A stream that yields iterable items synchronously
   */
  static sync<T>(it: SyncItera<T>): SyncStreamOps<T> {
    return new SyncStreamOps(
      new SyncIterableStream(Symbol.iterator in it ? it[Symbol.iterator]() : it)
    );
  }

  /**
   * @param it Simular to Stream.sync, async iterable on the basis of which a stream will be built
   * @returns A stream that yields iterable items asynchronously
   */
  static async<T>(it: AsyncItera<T>): AsyncStreamOps<T> {
    return new AsyncStreamOps(
      new AsyncIterableStream(
        Symbol.asyncIterator in it ? it[Symbol.asyncIterator]() : it
      )
    );
  }

  /**
   * @param it Simular to Stream.sync/async, sync/async iterable that contains promises
   * @returns A stream that yields promises result preserving its order
   */
  static gather<T>(it: AnyItera<Promise<T>>): AsyncStreamOps<T> {
    return new AsyncStreamOps(new GatherIterableStream(intoIter(it)));
  }

  /**
   * @param value Item that stream will yield infinitely
   * @returns Stream that yields same value
   */
  static repeat<T>(value: () => T): SyncStreamOps<T> {
    return this.iterate((_) => [value(), _], null);
  }

  /**
   * @param value Item that stream will yield infinitely
   * @returns Stream that yields same value
   */
  static repeatAsync<T>(value: () => Promise<T>): AsyncStreamOps<T> {
    return this.iterateAsync((_) => value().then((x) => [x, _]), null);
  }

  /**
   * @param start Field determines first value yielded
   * @param step Field determines how changes yielding value yield by yield
   * @returns An infinite stream that yield items, each subsequent one of which is greater than the previous one by `step`, starts at `start`
   */
  static count(start: number = 0, step: number = 1): SyncStreamOps<number> {
    return this.iterate((x) => [x, x + step], start);
  }

  /**
   * @param fn Transformer function, accepts previous value (init / second item of tuple from last return) and returns [ITEM, NEXT_INIT]
   * @returns An infinite stream which items are first item of a tuple `fn` returns
   */
  static iterate<T, A>(fn: (a: A) => [T, A], init: A): SyncStreamOps<T> {
    return new SyncStreamOps(new SyncIterateStream(fn, init));
  }

  /**
   * @returns An asynchronous stream simular to Stream.iterate, but function returns promise instead of pure value
   */
  static iterateAsync<T, A>(
    fn: (a: A) => Promising<[T, A]>,
    init: A
  ): AsyncStreamOps<T> {
    return new AsyncStreamOps(new AsyncIterateStream(fn, init));
  }

  /**
   * @param stream Underlying stream
   * @returns A stream-like object with a set of utility methods
   */
  static ops<T>(stream: SyncStream<T>): SyncStreamOps<T>;
  static ops<T>(stream: AsyncStream<T>): AsyncStreamOps<T>;
  static ops<T>(stream: AnyStream<T>): AnyOps<T> {
    if (stream.sync) {
      return new SyncStreamOps(stream);
    } else {
      return new AsyncStreamOps(stream);
    }
  }
}

export default Stream;
