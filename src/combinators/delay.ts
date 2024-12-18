import { AsyncStream } from "../base";
import { DelayStreamKind, StreamItem } from "../types";

export class AsyncDelayStream<T> extends AsyncStream<T> {
  #stream;
  #next;
  #ms;

  constructor(stream: AsyncStream<T>, kind: DelayStreamKind, ms: number) {
    super();
    this.#stream = stream;
    this.#next = (kind === "before-pull" ? this.#before : this.#after).bind(
      this
    );
    this.#ms = ms;
  }

  nextItem(): Promise<StreamItem<T>> {
    return this.#next() as Promise<StreamItem<T>>;
  }

  async #before() {
    await new Promise((r) => setTimeout(r, this.#ms));
    return this.#stream.nextItem();
  }

  async #after() {
    const item = await this.#stream.nextItem();
    await new Promise((r) => setTimeout(r, this.#ms));
    return item;
  }
}
