import { AsyncStream, SyncStream } from "../base";
import { Either, StreamItem } from "../types";
import { Items } from "../utils";

export class SyncAttemptStream<T> extends SyncStream<Either<unknown, T>> {
  #stream;

  constructor(stream: SyncStream<T>) {
    super();
    this.#stream = stream;
  }

  nextItem(): StreamItem<Either<unknown, T>> {
    const item = this.#stream.nextItem();
    if ("done" in item) return item;
    if ("error" in item) return Items.item({ left: item.error });
    return Items.item({ right: item.value });
  }
}

export class AsyncAttemptStream<T> extends AsyncStream<Either<unknown, T>> {
  #stream;

  constructor(stream: AsyncStream<T>) {
    super();
    this.#stream = stream;
  }

  async nextItem(): Promise<StreamItem<Either<unknown, T>>> {
    const item = await this.#stream.nextItem();
    if ("done" in item) return item;
    if ("error" in item) return Items.item({ left: item.error });
    return Items.item({ right: item.value });
  }
}
