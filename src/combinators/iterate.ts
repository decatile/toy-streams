import { SyncStream, AsyncStream } from "../base";
import { StreamItem } from "../types";
import { Items } from "../utils";

export class SyncIterateStream<T> extends SyncStream<T> {
    #fn;
    #start;
  
    constructor(fn: (a: number) => T, start: number) {
      super();
      this.#fn = fn;
      this.#start = start;
    }
  
    nextItem(): StreamItem<T> {
      try {
        return Items.item(this.#fn(this.#start++));
      } catch (e) {
        return Items.error(e);
      }
    }
  }
  
export  class AsyncIterateStream<T> extends AsyncStream<T> {
    #fn;
    #start;
  
    constructor(fn: (a: number) => T | Promise<T>, start: number) {
      super();
      this.#fn = fn;
      this.#start = start;
    }
  
    async nextItem(): Promise<StreamItem<T>> {
      try {
        return Items.item(await this.#fn(this.#start++));
      } catch (e) {
        return Items.error(e);
      }
    }
  }