import type { AsyncStream, SyncStream } from "./base";
import type { AsyncStreamOps, SyncStreamOps } from "./ops";

export type StreamItem<T> = { value: T } | { error: unknown } | { done: true };

export type AnyStream<T> = SyncStream<T> | AsyncStream<T>;

export type AnyOps<T> = SyncStreamOps<T> | AsyncStreamOps<T>;

export type AnyItera<T> =
  | Iterable<T>
  | Iterator<T>
  | AsyncIterable<T>
  | AsyncIterator<T>;

export type WindowStreamKind = "take" | "skip";

export type WhileStreamKind = "take-while" | "drop-while";

export type DelayStreamKind = "before-pull" | "after-pull";

export type JoinStreamKind =
  | "inner-join"
  | "left-join"
  | "right-join"
  | "full-join";

export type JoinStreamReturnType<A, B, K extends JoinStreamKind> = {
  "inner-join": [A, B];
  "left-join": [A, B | null];
  "right-join": [A | null, B];
  "full-join": [A, B] | [A, null] | [null, B];
}[K];

export type Promising<T> = T | Promise<T>;
