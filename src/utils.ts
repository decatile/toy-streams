import type { AnyItera, StreamItem } from "./types";

const STREAM_CANCEL_SIGNAL = Symbol("toy-streams.stream-cancel");

/**
 * Call this function in stream callback to end stream. Note: it throws a specific exception,
 * so be sure to not throw it in `try` blocks
 */
export function cancelStream(): never {
  throw STREAM_CANCEL_SIGNAL;
}

export const Item = Object.freeze({
  done: Object.freeze({ done: true }) as { done: true },
  value: <T>(value: T) => ({ value }),
  error: (error: unknown) => ({ error }),
  wrapError: (error: unknown) =>
    error === STREAM_CANCEL_SIGNAL ? Item.done : Item.error(error),
  left: (error: unknown) => ({ value: { left: error } }),
  right: <T>(value: T) => ({ value: { right: value } }),
  from: <T>(item: IteratorResult<T>) =>
    item.done ?? false ? Item.done : Item.value(item.value),
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
