import { AsyncStream } from "../base";
import { StreamItem } from "../types";
import { Item } from "../utils";

const STREAM_DONE_SIGNAL = Symbol("toy-streams.stream-done");

export class AsyncInterruptStream<T> extends AsyncStream<T> {
  #ctl = new AbortController();
  #done = false;
  #stream;
  #promise = new Promise<StreamItem<T>>((resolve) => {
    const handler = () => {
      this.#done = true;
      this.#ctl.signal.removeEventListener("abort", handler);
      const r = this.#ctl.signal.reason;
      resolve(r === STREAM_DONE_SIGNAL ? Item.done : Item.error(r));
    };
    this.#ctl.signal.addEventListener("abort", handler);
  });

  constructor(stream: AsyncStream<T>) {
    super();
    this.#stream = stream;
  }

  nextItem(): Promise<StreamItem<T>> {
    if (this.#done) return Promise.resolve(Item.done);
    return Promise.race([this.#stream.nextItem(), this.#promise]);
  }

  interrupt(error?: unknown) {
    this.#ctl.abort(error === undefined ? STREAM_DONE_SIGNAL : error);
  }
}
