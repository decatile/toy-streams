export type StreamItem<T> = { value: T } | { error: unknown } | { done: true };

export type AnyItera<T> =
  | Iterable<T>
  | Iterator<T>
  | AsyncIterable<T>
  | AsyncIterator<T>;

export type JoinStreamKind = "inner" | "left" | "right" | "full";

export type JoinStreamReturnType<A, B, K extends JoinStreamKind> = {
  inner: [A, B];
  left: [A, B | null];
  right: [A | null, B];
  full: [A, B] | [A, null] | [null, B];
}[K];

export type Promising<T> = T | Promise<T>;
