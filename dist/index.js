var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SyncBatchesStream_instances, _SyncBatchesStream_swap, _AsyncBatchesStream_instances, _AsyncBatchesStream_swap;
function eos() {
    return { done: true, value: undefined };
}
function intoIterator(it) {
    return Symbol.iterator in it
        ? it[Symbol.iterator]()
        : Symbol.asyncIterator in it
            ? it[Symbol.asyncIterator]()
            : it;
}
export class Stream {
    constructor(sync) {
        this.sync = sync;
    }
    static once(x) {
        return new SyncOnceStream(x);
    }
    static onceAsync(x) {
        return new AsyncOnceStream(x);
    }
    static moreAsync(x) {
        return new AsyncMoreStream(x);
    }
    static sync(it) {
        return new SyncIterableStream(Symbol.iterator in it ? it[Symbol.iterator]() : it);
    }
    static async(it) {
        return new AsyncIterableStream(Symbol.asyncIterator in it ? it[Symbol.asyncIterator]() : it);
    }
    static gather(it) {
        return new GatherIterableStream(intoIterator(it));
    }
    static flatten(it) {
        if (it.sync) {
            return new SyncFlattenStream(it);
        }
        else {
            return new AsyncFlattenStream(it);
        }
    }
    static iterate(fn, start = 0) {
        return new SyncIterateStream(fn, start);
    }
    static iterateAsync(fn, start = 0) {
        return new AsyncIterateStream(fn, start);
    }
}
export default Stream;
export class SyncStream extends Stream {
    constructor() {
        super(true);
    }
    [Symbol.iterator]() {
        return this;
    }
    map(fn) {
        return new SyncMapStream(this, fn);
    }
    mapAsync(fn) {
        return new AsyncMapStream(this.intoAsync(), fn);
    }
    flatMap(fn) {
        return new SyncFlatMapStream(this, fn);
    }
    flatMapAsync(fn) {
        return new AsyncFlatMapStream(this.intoAsync(), fn);
    }
    filter(fn) {
        return new SyncFilterStream(this, fn);
    }
    filterAsync(fn) {
        return new AsyncFilterStream(this.intoAsync(), fn);
    }
    window({ skip, take }) {
        return new SyncWindowStream(this, skip, take);
    }
    forEach(fn) {
        while (1) {
            const { done, value } = this.next();
            if (done)
                return;
            fn(value);
        }
    }
    delayed(ms) {
        return new AsyncDelayedStream(this.intoAsync(), ms);
    }
    extend(other) {
        if (other.sync) {
            return new SyncExtendStream(this, other);
        }
        else {
            return new AsyncExtendStream(this.intoAsync(), other);
        }
    }
    reduce(fn, init) {
        while (1) {
            const { done, value } = this.next();
            if (done)
                return init;
            init = fn(value, init);
        }
        throw Error("Impossible");
    }
    collect() {
        return [...this];
    }
    measuring() {
        return new SyncMeasuringStream(this);
    }
    intoAsync() {
        return new SyncIntoAsyncStreamAdapter(this);
    }
    batches(n) {
        return new SyncBatchesStream(this, n);
    }
    first() {
        const { done, value } = this.next();
        return done ? undefined : value;
    }
    last() {
        let item = undefined;
        while (1) {
            const { done, value } = this.next();
            if (done)
                return item;
            item = value;
        }
    }
}
export class AsyncStream extends Stream {
    constructor() {
        super(false);
    }
    [Symbol.asyncIterator]() {
        return this;
    }
    map(fn) {
        return new AsyncMapStream(this, fn);
    }
    flatMap(fn) {
        return new AsyncFlatMapStream(this, fn);
    }
    filter(fn) {
        return new AsyncFilterStream(this, fn);
    }
    window(skip, take) {
        return new AsyncWindowStream(this, skip, take);
    }
    async forEach(fn) {
        while (1) {
            const { done, value } = await this.next();
            if (done)
                return;
            await fn(value);
        }
    }
    delayed(ms) {
        return new AsyncDelayedStream(this, ms);
    }
    extend(other) {
        return new AsyncExtendStream(this, other.sync ? other.intoAsync() : other);
    }
    async reduce(fn, init) {
        while (1) {
            const { done, value } = await this.next();
            if (done)
                return init;
            init = await fn(value, init);
        }
        throw Error("Impossible");
    }
    async collect() {
        const result = [];
        for await (const x of this)
            result.push(x);
        return result;
    }
    measuring() {
        return new AsyncMeasuringStream(this);
    }
    batches(n) {
        return new AsyncBatchesStream(this, n);
    }
    async first() {
        const { done, value } = await this.next();
        return done ? undefined : value;
    }
    async last() {
        let item = undefined;
        while (1) {
            const { done, value } = await this.next();
            if (done)
                return item;
            item = value;
        }
    }
}
class SyncIntoAsyncStreamAdapter extends AsyncStream {
    constructor(stream) {
        super();
        this.stream = stream;
    }
    async next() {
        return this.stream.next();
    }
}
class SyncOnceStream extends SyncStream {
    constructor(x) {
        super();
        this.x = x;
        this.done = false;
    }
    next() {
        if (this.done)
            return eos();
        this.done = true;
        return { done: false, value: this.x };
    }
}
class AsyncOnceStream extends AsyncStream {
    constructor(x) {
        super();
        this.x = x;
        this.done = false;
    }
    async next() {
        if (this.done)
            return eos();
        this.done = true;
        return { done: false, value: await this.x };
    }
}
class AsyncMoreStream extends AsyncStream {
    constructor(x) {
        super();
        this.x = x;
        this.storage = null;
    }
    async next() {
        if (!this.storage) {
            this.storage = intoIterator(await this.x);
        }
        return this.storage.next();
    }
}
class SyncIterableStream extends SyncStream {
    constructor(it) {
        super();
        this.it = it;
    }
    next() {
        return this.it.next();
    }
}
class AsyncIterableStream extends AsyncStream {
    constructor(it) {
        super();
        this.it = it;
    }
    next() {
        return this.it.next();
    }
}
class GatherIterableStream extends AsyncStream {
    constructor(it) {
        super();
        this.it = it;
    }
    async next() {
        const { done, value } = await this.it.next();
        return { done, value: await value };
    }
}
class SyncMapStream extends SyncStream {
    constructor(stream, fn) {
        super();
        this.stream = stream;
        this.fn = fn;
    }
    next() {
        const { done, value } = this.stream.next();
        if (done)
            return eos();
        return { done, value: this.fn(value) };
    }
}
class AsyncMapStream extends AsyncStream {
    constructor(stream, fn) {
        super();
        this.stream = stream;
        this.fn = fn;
    }
    async next() {
        const { done, value } = await this.stream.next();
        if (done)
            return eos();
        return { done, value: await this.fn(value) };
    }
}
class SyncFlatMapStream extends SyncStream {
    constructor(stream, fn) {
        super();
        this.stream = stream;
        this.fn = fn;
        this.current = null;
    }
    next() {
        while (1) {
            if (!this.current) {
                const { done, value } = this.stream.next();
                if (done)
                    return { done, value };
                const it = this.fn(value);
                this.current = Symbol.iterator in it ? it[Symbol.iterator]() : it;
            }
            const { done, value } = this.current.next();
            if (!done)
                return { done, value };
            this.current = null;
        }
        throw Error("Impossible");
    }
}
class AsyncFlatMapStream extends AsyncStream {
    constructor(stream, fn) {
        super();
        this.stream = stream;
        this.fn = fn;
        this.current = null;
    }
    async next() {
        while (1) {
            if (!this.current) {
                const { done, value } = await this.stream.next();
                if (done)
                    return { done, value };
                const it = await this.fn(value);
                this.current =
                    Symbol.iterator in it
                        ? it[Symbol.iterator]()
                        : Symbol.asyncIterator in it
                            ? it[Symbol.asyncIterator]()
                            : it;
            }
            const { done, value } = await this.current.next();
            if (!done)
                return { done, value };
            this.current = null;
        }
        throw Error("Impossible");
    }
}
class SyncFilterStream extends SyncStream {
    constructor(stream, fn) {
        super();
        this.stream = stream;
        this.fn = fn;
    }
    next() {
        while (1) {
            const { done, value } = this.stream.next();
            if (done)
                return eos();
            if (this.fn(value))
                return { done, value };
        }
        throw Error("Impossible");
    }
}
class AsyncFilterStream extends AsyncStream {
    constructor(stream, fn) {
        super();
        this.stream = stream;
        this.fn = fn;
    }
    async next() {
        while (1) {
            const { done, value } = await this.stream.next();
            if (done)
                return eos();
            if (await this.fn(value))
                return { done, value };
        }
        throw Error("Impossible");
    }
}
class SyncWindowStream extends SyncStream {
    constructor(stream, skip = undefined, take = undefined) {
        super();
        this.stream = stream;
        this.skip = skip;
        this.take = take;
    }
    next() {
        while (this.skip) {
            if (this.stream.next().done)
                return eos();
            this.skip--;
        }
        if (this.take === undefined) {
            return this.stream.next();
        }
        if (!this.take)
            return eos();
        const { done, value } = this.stream.next();
        if (done)
            return eos();
        this.take--;
        return { done, value };
    }
}
class AsyncWindowStream extends AsyncStream {
    constructor(stream, skip = undefined, take = undefined) {
        super();
        this.stream = stream;
        this.skip = skip;
        this.take = take;
    }
    async next() {
        while (this.skip) {
            if ((await this.stream.next()).done)
                return eos();
            this.skip--;
        }
        if (this.take === undefined) {
            return this.stream.next();
        }
        if (!this.take)
            return eos();
        const { done, value } = await this.stream.next();
        if (done)
            return { done, value };
        this.take--;
        return { done, value };
    }
}
class SyncFlattenStream extends SyncStream {
    constructor(stream) {
        super();
        this.stream = stream;
        this.current = null;
    }
    next() {
        while (1) {
            if (!this.current) {
                const { done, value } = this.stream.next();
                if (done)
                    return { done, value };
                this.current = value;
            }
            const { done, value } = this.current.next();
            if (!done)
                return { done, value };
            this.current = null;
        }
        throw Error("Impossible");
    }
}
class AsyncFlattenStream extends AsyncStream {
    constructor(stream) {
        super();
        this.stream = stream;
        this.current = null;
    }
    async next() {
        while (1) {
            if (!this.current) {
                const { done, value } = await this.stream.next();
                if (done)
                    return { done, value };
                this.current = value.sync ? value.intoAsync() : value;
            }
            const { done, value } = await this.current.next();
            if (!done)
                return { done, value };
            this.current = null;
        }
        throw Error("Impossible");
    }
}
class SyncIterateStream extends SyncStream {
    constructor(fn, start) {
        super();
        this.fn = fn;
        this.start = start;
    }
    next() {
        return { done: false, value: this.fn(this.start++) };
    }
}
class AsyncIterateStream extends AsyncStream {
    constructor(fn, start) {
        super();
        this.fn = fn;
        this.start = start;
    }
    async next() {
        return { done: false, value: await this.fn(this.start++) };
    }
}
class AsyncDelayedStream extends AsyncStream {
    constructor(stream, ms) {
        super();
        this.stream = stream;
        this.ms = ms;
    }
    async next() {
        await new Promise((r) => setTimeout(r, this.ms));
        return this.stream.next();
    }
}
class SyncExtendStream extends AsyncStream {
    constructor(s1, s2) {
        super();
        this.index = 0;
        this.streams = [s1, s2];
    }
    async next() {
        while (1) {
            const current = this.streams[this.index];
            if (!current)
                return eos();
            const { done, value } = current.next();
            if (!done)
                return { done, value };
            this.index++;
        }
        throw Error("Impossible");
    }
}
class AsyncExtendStream extends AsyncStream {
    constructor(s1, s2) {
        super();
        this.index = 0;
        this.streams = [s1, s2];
    }
    async next() {
        while (1) {
            const current = this.streams[this.index];
            if (!current)
                return eos();
            const { done, value } = await current.next();
            if (!done)
                return { done, value };
            this.index++;
        }
        throw Error("Impossible");
    }
}
class SyncMeasuringStream extends SyncStream {
    constructor(stream) {
        super();
        this.stream = stream;
    }
    next() {
        const from = performance.now();
        const { done, value } = this.stream.next();
        if (done)
            return { done, value };
        return { done, value: [value, performance.now() - from] };
    }
}
class AsyncMeasuringStream extends AsyncStream {
    constructor(stream) {
        super();
        this.stream = stream;
    }
    async next() {
        const from = performance.now();
        const { done, value } = await this.stream.next();
        if (done)
            return { done, value };
        return { done, value: [value, performance.now() - from] };
    }
}
class SyncBatchesStream extends SyncStream {
    constructor(stream, count) {
        super();
        _SyncBatchesStream_instances.add(this);
        this.stream = stream;
        this.count = count;
        this.storage = [];
        this.done = false;
    }
    next() {
        if (this.done)
            return eos();
        while (this.storage.length < this.count) {
            const { done, value } = this.stream.next();
            if (done) {
                this.done = true;
                return { done: false, value: __classPrivateFieldGet(this, _SyncBatchesStream_instances, "m", _SyncBatchesStream_swap).call(this) };
            }
            this.storage.push(value);
        }
        return { done: false, value: __classPrivateFieldGet(this, _SyncBatchesStream_instances, "m", _SyncBatchesStream_swap).call(this) };
    }
}
_SyncBatchesStream_instances = new WeakSet(), _SyncBatchesStream_swap = function _SyncBatchesStream_swap() {
    const r = this.storage;
    this.storage = [];
    return r;
};
class AsyncBatchesStream extends AsyncStream {
    constructor(stream, count) {
        super();
        _AsyncBatchesStream_instances.add(this);
        this.stream = stream;
        this.count = count;
        this.storage = [];
        this.done = false;
    }
    async next() {
        if (this.done)
            return eos();
        while (this.storage.length < this.count) {
            const { done, value } = await this.stream.next();
            if (done) {
                this.done = true;
                return { done: false, value: __classPrivateFieldGet(this, _AsyncBatchesStream_instances, "m", _AsyncBatchesStream_swap).call(this) };
            }
            this.storage.push(value);
        }
        return { done: false, value: __classPrivateFieldGet(this, _AsyncBatchesStream_instances, "m", _AsyncBatchesStream_swap).call(this) };
    }
}
_AsyncBatchesStream_instances = new WeakSet(), _AsyncBatchesStream_swap = function _AsyncBatchesStream_swap() {
    const r = this.storage;
    this.storage = [];
    return r;
};
//# sourceMappingURL=index.js.map