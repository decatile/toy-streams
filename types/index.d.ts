type AnyItera<T> = Iterable<T> | Iterator<T> | AsyncIterable<T> | AsyncIterator<T>;
export declare abstract class Stream<S> {
    readonly sync: S;
    constructor(sync: S);
    static once<T>(x: T): SyncStream<T>;
    static onceAsync<T>(x: Promise<T>): AsyncStream<T>;
    static moreAsync<T>(x: Promise<AnyItera<T>>): AsyncStream<T>;
    static sync<T>(it: Iterable<T> | Iterator<T>): SyncStream<T>;
    static async<T>(it: AsyncIterable<T> | AsyncIterator<T>): AsyncStream<T>;
    static gather<T>(it: AnyItera<Promise<T>>): AsyncStream<T>;
    static flatten<T>(it: SyncStream<SyncStream<T>>): SyncStream<T>;
    static flatten<T>(it: AsyncStream<SyncStream<T> | AsyncStream<T>>): AsyncStream<T>;
    static iterate<T>(fn: (a: number) => T, start?: number): SyncStream<T>;
    static iterateAsync<T>(fn: (a: number) => T | Promise<T>, start?: number): AsyncStream<T>;
}
export default Stream;
export declare abstract class SyncStream<T> extends Stream<true> implements Iterable<T>, Iterator<T> {
    constructor();
    [Symbol.iterator](): this;
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
    collect(): T[];
    measuring(): SyncStream<[T, number]>;
    intoAsync(): AsyncStream<T>;
    batches(n: number): SyncStream<T[]>;
    first(): T | undefined;
    last(): T | undefined;
    abstract next(): IteratorResult<T>;
}
export declare abstract class AsyncStream<T> extends Stream<false> implements AsyncIterable<T>, AsyncIterator<T> {
    constructor();
    [Symbol.asyncIterator](): this;
    map<T1>(fn: (a: T) => T1 | Promise<T1>): AsyncStream<T1>;
    flatMap<T1>(fn: (a: T) => AnyItera<T1> | Promise<AnyItera<T1>>): AsyncStream<T1>;
    filter(fn: (a: T) => boolean | Promise<boolean>): AsyncStream<T>;
    window(skip: number, take: number): AsyncStream<T>;
    forEach(fn: (a: T) => any | Promise<any>): Promise<void>;
    delayed(ms: number): AsyncStream<T>;
    extend(other: SyncStream<T> | AsyncStream<T>): AsyncStream<T>;
    reduce<R>(fn: (a: T, b: R) => R | Promise<R>, init: R): Promise<R>;
    collect(): Promise<T[]>;
    measuring(): AsyncStream<[T, number]>;
    batches(n: number): AsyncStream<T[]>;
    first(): Promise<T | undefined>;
    last(): Promise<T | undefined>;
    abstract next(): Promise<IteratorResult<T>>;
}
