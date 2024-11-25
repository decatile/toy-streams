type StreamItem<T> = {
    i: T;
} | {
    e: unknown;
} | {
    d: true;
};
declare const StreamItem: Readonly<{
    done: {
        d: true;
    };
    item: <T>(value: T) => {
        i: T;
    };
    error: (error: unknown) => {
        e: unknown;
    };
    fromResult: <T>(item: IteratorResult<T>) => {
        d: true;
    } | {
        i: T;
    };
    intoResult: <T>(item: StreamItem<T>) => {
        done: false;
        value: T;
    } | {
        done: true;
        value: undefined;
    };
}>;
type AnyItera<T> = Iterable<T> | Iterator<T> | AsyncIterable<T> | AsyncIterator<T>;
export declare abstract class Stream<S> {
    readonly sync: S;
    constructor(sync: S);
    static fail<T>(error: unknown): SyncStream<T>;
    static sync<T>(it: Iterable<T> | Iterator<T>): SyncStream<T>;
    static async<T>(it: AsyncIterable<T> | AsyncIterator<T>): AsyncStream<T>;
    static gather<T>(it: AnyItera<Promise<T>>): AsyncStream<T>;
    static flatten<T>(it: SyncStream<SyncStream<T>>): SyncStream<T>;
    static flatten<T>(it: AsyncStream<SyncStream<T> | AsyncStream<T>>): AsyncStream<T>;
    static count(start?: number): SyncStream<number>;
    static iterate<T>(fn: (a: number) => T, start?: number): SyncStream<T>;
    static iterateAsync<T>(fn: (a: number) => T | Promise<T>, start?: number): AsyncStream<T>;
}
export default Stream;
export declare abstract class SyncStream<T> extends Stream<true> {
    constructor();
    map<T1>(fn: (a: T) => T1): SyncStream<T1>;
    mapAsync<T1>(fn: (a: T) => Promise<T1>): AsyncStream<T1>;
    flatMap<T1>(fn: (a: T) => Iterable<T1> | Iterator<T1>): SyncStream<T1>;
    flatMapAsync<T1>(fn: (a: T) => AnyItera<T1> | Promise<AnyItera<T1>>): AsyncStream<T1>;
    filter(fn: (a: T) => boolean): SyncStream<T>;
    filterAsync(fn: (a: T) => Promise<boolean>): AsyncStream<T>;
    window({ skip, take }: {
        skip?: number;
        take?: number;
    }): SyncStream<T>;
    forEach(fn: (a: T) => any): void;
    delayed(ms: number): AsyncStream<T>;
    extend(other: SyncStream<T>): SyncStream<T>;
    extend(other: AsyncStream<T>): AsyncStream<T>;
    reduce<R>(fn: (a: T, b: R) => R, init: R): R;
    measured(): SyncStream<[T, number]>;
    intoAsync(): AsyncStream<T>;
    iterator(): Iterable<T> & Iterator<T>;
    batches(n: number): SyncStream<T[]>;
    first(): T | null;
    last(): T | null;
    zipWith<T1, K extends ZipStreamKind>(other: SyncStream<T1>, kind: K): SyncStream<ZipStreamReturnType<T, T1, K>>;
    zipWith<T1, K extends ZipStreamKind>(other: AsyncStream<T1>, kind: K): AsyncStream<ZipStreamReturnType<T, T1, K>>;
    abstract nextItem(): StreamItem<T>;
}
export declare abstract class AsyncStream<T> extends Stream<false> {
    constructor();
    map<T1>(fn: (a: T) => T1 | Promise<T1>): AsyncStream<T1>;
    flatMap<T1>(fn: (a: T) => AnyItera<T1> | Promise<AnyItera<T1>>): AsyncStream<T1>;
    filter(fn: (a: T) => boolean | Promise<boolean>): AsyncStream<T>;
    window(skip: number, take: number): AsyncStream<T>;
    forEach(fn: (a: T) => any | Promise<any>): Promise<void>;
    delayed(ms: number): AsyncStream<T>;
    extend(other: SyncStream<T> | AsyncStream<T>): AsyncStream<T>;
    reduce<R>(fn: (a: T, b: R) => R | Promise<R>, init: R): Promise<R>;
    measured(): AsyncStream<[T, number]>;
    iterator(): AsyncIterable<T> & AsyncIterator<T>;
    batches(n: number): AsyncStream<T[]>;
    first(): Promise<T | null>;
    last(): Promise<T | null>;
    zipWith<T1, K extends ZipStreamKind>(other: SyncStream<T1> | AsyncStream<T1>, kind: K): AsyncStream<ZipStreamReturnType<T, T1, K>>;
    abstract nextItem(): Promise<StreamItem<T>>;
}
type ZipStreamKind = "inner" | "left" | "right" | "full";
type ZipStreamReturnType<A, B, K extends ZipStreamKind> = {
    inner: [A, B];
    left: [A, B | null];
    right: [A | null, B];
    full: [A, B] | [A, null] | [null, B];
}[K];
