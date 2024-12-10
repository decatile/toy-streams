import { AsyncStream } from "../base";
import { StreamItem } from "../types";
import { Item } from "../utils";

const STREAM_DONE_SIGNAL = Symbol("toy-streams.stream-done");

export class AsyncInterruptStream<T> extends AsyncStream<T> {
  #stream;
  #ctl = new AbortController();
  #item = null as StreamItem<T> | null;
  #promise = new Promise<StreamItem<T>>((resolve) => {
    const handler = () => {
      this.#ctl.signal.removeEventListener("abort", handler);
      const r = this.#ctl.signal.reason;
      this.#item = r === STREAM_DONE_SIGNAL ? Item.done : Item.error(r);
      resolve(this.#item);
    };
    this.#ctl.signal.addEventListener("abort", handler);
  });

  constructor(stream: AsyncStream<T>) {
    super();
    this.#stream = stream;
  }

  async nextItem(): Promise<StreamItem<T>> {
    if (this.#item !== null) {
      if ("done" in this.#item) return this.#item;
      if ("error" in this.#item) {
        const item = this.#item;
        this.#item = Item.done;
        return item;
      }
    }
    return Promise.race([this.#stream.nextItem(), this.#promise]);
  }

  interrupt(error?: unknown) {
    this.#ctl.abort(error === undefined ? STREAM_DONE_SIGNAL : error);
  }
}
