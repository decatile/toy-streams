import type { AnyItera, StreamItem } from "./types";

export const STREAM_CANCEL_SIGNAL = Symbol("toy-streams.stream-cancel");

/**
 * Call this function in stream callack to end stream
 */
export function cancelStream() {
  throw STREAM_CANCEL_SIGNAL;
}

export const Items = Object.freeze({
  done: { done: true as const },
  item: <T>(value: T) => ({ value }),
  error: (error: unknown) => ({ error }),
  from: <T>(item: IteratorResult<T>) =>
    item.done ? Items.done : Items.item(item.value),
  into: <T>(item: StreamItem<T>) => {
    if ("value" in item) {
      return { done: false as const, ...item };
    }
    if ("done" in item) return item as IteratorResult<T>;
    throw item.error;
  },
});

export function intoIter<T>(it: AnyItera<T>) {
  return Symbol.iterator in it
    ? it[Symbol.iterator]()
    : Symbol.asyncIterator in it
    ? it[Symbol.asyncIterator]()
    : it;
}
