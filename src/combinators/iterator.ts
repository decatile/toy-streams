import { AsyncStream, SyncStream } from "../base";
import { Items } from "../utils";

export class SyncIntoIteratorStreamAdapter<T>
  implements Iterable<T>, Iterator<T>
{
  #stream;

  constructor(stream: SyncStream<T>) {
    this.#stream = stream;
  }

  [Symbol.iterator]() {
    return this;
  }

  next(): IteratorResult<T, any> {
    return Items.into(this.#stream.nextItem());
  }
}

export class AsyncIntoIteratorStreamAdapter<T>
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
    return Items.into(await this.#stream.nextItem());
  }
}
