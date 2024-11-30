import { AsyncStream } from "../base";
import { StreamItem } from "../types";

export class AsyncThrottleStream<T> extends AsyncStream<T> {
  #stream;
  #ms;

  constructor(stream: AsyncStream<T>, ms: number) {
    super();
    this.#stream = stream;
    this.#ms = ms;
  }

  async nextItem(): Promise<StreamItem<T>> {
    return (
      await Promise.all([
        this.#stream.nextItem(),
        new Promise((r) => setTimeout(r, this.#ms)),
      ])
    )[0];
  }
}
