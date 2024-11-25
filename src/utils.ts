import type { AnyItera, StreamItem } from "./types";

export const Items = Object.freeze({
  done: { d: true as const },
  item: <T>(value: T) => ({ i: value }),
  error: (error: unknown) => ({ e: error }),
  from: <T>(item: IteratorResult<T>) =>
    item.done ? Items.done : Items.item(item.value),
  into: <T>(item: StreamItem<T>) => {
    if ("i" in item) {
      return { done: false as const, value: item.i };
    }
    if ("d" in item) {
      return { done: true as const, value: undefined };
    }
    throw item.e;
  },
});

export function intoIter<T>(it: AnyItera<T>) {
  return Symbol.iterator in it
    ? it[Symbol.iterator]()
    : Symbol.asyncIterator in it
    ? it[Symbol.asyncIterator]()
    : it;
}
