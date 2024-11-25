import { AsyncStream, SyncStream } from "../base";
import { StreamItem } from "../types";

export class SyncIntoAsyncStreamAdapter<T> extends AsyncStream<T> {
  #stream;

  constructor(stream: SyncStream<T>) {
    super();
    this.#stream = stream;
  }

  async nextItem(): Promise<StreamItem<T>> {
    return this.#stream.nextItem();
  }
}
