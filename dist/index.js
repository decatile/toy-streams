var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SyncIntoIteratorStreamAdapter_stream, _AsyncIntoIteratorStreamAdapter_stream, _SyncFailStream_error, _SyncIntoAsyncStreamAdapter_stream, _SyncIterableStream_it, _AsyncIterableStream_it, _GatherIterableStream_it, _SyncMapStream_stream, _SyncMapStream_fn, _AsyncMapStream_stream, _AsyncMapStream_fn, _SyncFlatMapStream_current, _SyncFlatMapStream_stream, _SyncFlatMapStream_fn, _AsyncFlatMapStream_current, _AsyncFlatMapStream_stream, _AsyncFlatMapStream_fn, _SyncFilterStream_stream, _SyncFilterStream_fn, _AsyncFilterStream_stream, _AsyncFilterStream_fn, _SyncWindowStream_stream, _SyncWindowStream_skip, _SyncWindowStream_take, _AsyncWindowStream_stream, _AsyncWindowStream_skip, _AsyncWindowStream_take, _SyncFlattenStream_current, _SyncFlattenStream_stream, _AsyncFlattenStream_current, _AsyncFlattenStream_stream, _SyncIterateStream_fn, _SyncIterateStream_start, _AsyncIterateStream_fn, _AsyncIterateStream_start, _AsyncDelayedStream_stream, _AsyncDelayedStream_ms, _SyncExtendStream_streams, _SyncExtendStream_index, _AsyncExtendStream_streams, _AsyncExtendStream_index, _SyncMeasuringStream_stream, _AsyncMeasuredStream_stream, _SyncBatchesStream_instances, _SyncBatchesStream_storage, _SyncBatchesStream_done, _SyncBatchesStream_stream, _SyncBatchesStream_count, _SyncBatchesStream_swap, _AsyncBatchesStream_instances, _AsyncBatchesStream_storage, _AsyncBatchesStream_done, _AsyncBatchesStream_stream, _AsyncBatchesStream_count, _AsyncBatchesStream_swap, _SyncZipStream_instances, _SyncZipStream_aexhausted, _SyncZipStream_bexhausted, _SyncZipStream_next, _SyncZipStream_as, _SyncZipStream_bs, _SyncZipStream_inner, _SyncZipStream_left, _SyncZipStream_right, _SyncZipStream_full, _AsyncZipStream_instances, _AsyncZipStream_aexhausted, _AsyncZipStream_bexhausted, _AsyncZipStream_next, _AsyncZipStream_as, _AsyncZipStream_bs, _AsyncZipStream_inner, _AsyncZipStream_left, _AsyncZipStream_right, _AsyncZipStream_full;
const StreamItem = Object.freeze({
    done: { d: true },
    item: (value) => ({ i: value }),
    error: (error) => ({ e: error }),
    fromResult: (item) => item.done ? StreamItem.done : StreamItem.item(item.value),
    intoResult: (item) => {
        if ("i" in item) {
            return { done: false, value: item.i };
        }
        if ("d" in item) {
            return { done: true, value: undefined };
        }
        throw item.e;
    },
});
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
    static fail(error) {
        return new SyncFailStream(error);
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
    static count(start) {
        return this.iterate((x) => x, start);
    }
    static iterate(fn, start) {
        return new SyncIterateStream(fn, start !== null && start !== void 0 ? start : 0);
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
            const item = this.nextItem();
            if ("d" in item)
                return;
            if ("e" in item)
                throw item.e;
            fn(item.i);
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
            const item = this.nextItem();
            if ("d" in item)
                return init;
            if ("e" in item)
                throw item.e;
            init = fn(item.i, init);
        }
        throw Error("Impossible");
    }
    measured() {
        return new SyncMeasuringStream(this);
    }
    intoAsync() {
        return new SyncIntoAsyncStreamAdapter(this);
    }
    iterator() {
        return new SyncIntoIteratorStreamAdapter(this);
    }
    batches(n) {
        return new SyncBatchesStream(this, n);
    }
    first() {
        const item = this.nextItem();
        if ("d" in item)
            return null;
        if ("e" in item)
            throw item.e;
        return item.i;
    }
    last() {
        let r = null;
        while (1) {
            const item = this.nextItem();
            if ("d" in item)
                break;
            if ("e" in item)
                throw item.e;
            r = item.i;
        }
        return r;
    }
    zipWith(other, kind) {
        if (other.sync) {
            return new SyncZipStream(this, other, kind);
        }
        else {
            return new AsyncZipStream(this.intoAsync(), other, kind);
        }
    }
}
export class AsyncStream extends Stream {
    constructor() {
        super(false);
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
            const item = await this.nextItem();
            if ("d" in item)
                return;
            if ("e" in item)
                throw item.e;
            await fn(item.i);
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
            const item = await this.nextItem();
            if ("d" in item)
                return init;
            if ("e" in item)
                throw item.e;
            init = await fn(item.i, init);
        }
        throw Error("Impossible");
    }
    measured() {
        return new AsyncMeasuredStream(this);
    }
    iterator() {
        return new AsyncIntoIteratorStreamAdapter(this);
    }
    batches(n) {
        return new AsyncBatchesStream(this, n);
    }
    async first() {
        const item = await this.nextItem();
        if ("d" in item)
            return null;
        if ("e" in item)
            throw item.e;
        return item.i;
    }
    async last() {
        let r = null;
        while (1) {
            const item = await this.nextItem();
            if ("d" in item)
                break;
            if ("e" in item)
                throw item.e;
            r = item.i;
        }
        return r;
    }
    zipWith(other, kind) {
        return new AsyncZipStream(this, other.sync ? other.intoAsync() : other, kind);
    }
}
class SyncIntoIteratorStreamAdapter {
    constructor(stream) {
        _SyncIntoIteratorStreamAdapter_stream.set(this, void 0);
        __classPrivateFieldSet(this, _SyncIntoIteratorStreamAdapter_stream, stream, "f");
    }
    [(_SyncIntoIteratorStreamAdapter_stream = new WeakMap(), Symbol.iterator)]() {
        return this;
    }
    next() {
        return StreamItem.intoResult(__classPrivateFieldGet(this, _SyncIntoIteratorStreamAdapter_stream, "f").nextItem());
    }
}
class AsyncIntoIteratorStreamAdapter {
    constructor(stream) {
        _AsyncIntoIteratorStreamAdapter_stream.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncIntoIteratorStreamAdapter_stream, stream, "f");
    }
    [(_AsyncIntoIteratorStreamAdapter_stream = new WeakMap(), Symbol.asyncIterator)]() {
        return this;
    }
    async next() {
        return StreamItem.intoResult(await __classPrivateFieldGet(this, _AsyncIntoIteratorStreamAdapter_stream, "f").nextItem());
    }
}
class SyncFailStream extends SyncStream {
    constructor(error) {
        super();
        _SyncFailStream_error.set(this, void 0);
        __classPrivateFieldSet(this, _SyncFailStream_error, error, "f");
    }
    nextItem() {
        return StreamItem.error(__classPrivateFieldGet(this, _SyncFailStream_error, "f"));
    }
}
_SyncFailStream_error = new WeakMap();
class SyncIntoAsyncStreamAdapter extends AsyncStream {
    constructor(stream) {
        super();
        _SyncIntoAsyncStreamAdapter_stream.set(this, void 0);
        __classPrivateFieldSet(this, _SyncIntoAsyncStreamAdapter_stream, stream, "f");
    }
    async nextItem() {
        return __classPrivateFieldGet(this, _SyncIntoAsyncStreamAdapter_stream, "f").nextItem();
    }
}
_SyncIntoAsyncStreamAdapter_stream = new WeakMap();
class SyncIterableStream extends SyncStream {
    constructor(it) {
        super();
        _SyncIterableStream_it.set(this, void 0);
        __classPrivateFieldSet(this, _SyncIterableStream_it, it, "f");
    }
    nextItem() {
        try {
            return StreamItem.fromResult(__classPrivateFieldGet(this, _SyncIterableStream_it, "f").next());
        }
        catch (e) {
            return StreamItem.error(e);
        }
    }
}
_SyncIterableStream_it = new WeakMap();
class AsyncIterableStream extends AsyncStream {
    constructor(it) {
        super();
        _AsyncIterableStream_it.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncIterableStream_it, it, "f");
    }
    async nextItem() {
        try {
            return StreamItem.fromResult(await __classPrivateFieldGet(this, _AsyncIterableStream_it, "f").next());
        }
        catch (e) {
            return StreamItem.error(e);
        }
    }
}
_AsyncIterableStream_it = new WeakMap();
class GatherIterableStream extends AsyncStream {
    constructor(it) {
        super();
        _GatherIterableStream_it.set(this, void 0);
        __classPrivateFieldSet(this, _GatherIterableStream_it, it, "f");
    }
    async nextItem() {
        try {
            const { done, value } = await __classPrivateFieldGet(this, _GatherIterableStream_it, "f").next();
            if (done)
                return StreamItem.done;
            return StreamItem.item(await value);
        }
        catch (e) {
            return StreamItem.error(e);
        }
    }
}
_GatherIterableStream_it = new WeakMap();
class SyncMapStream extends SyncStream {
    constructor(stream, fn) {
        super();
        _SyncMapStream_stream.set(this, void 0);
        _SyncMapStream_fn.set(this, void 0);
        __classPrivateFieldSet(this, _SyncMapStream_stream, stream, "f");
        __classPrivateFieldSet(this, _SyncMapStream_fn, fn, "f");
    }
    nextItem() {
        const item = __classPrivateFieldGet(this, _SyncMapStream_stream, "f").nextItem();
        if (!("i" in item))
            return item;
        try {
            return StreamItem.item(__classPrivateFieldGet(this, _SyncMapStream_fn, "f").call(this, item.i));
        }
        catch (e) {
            return StreamItem.error(e);
        }
    }
}
_SyncMapStream_stream = new WeakMap(), _SyncMapStream_fn = new WeakMap();
class AsyncMapStream extends AsyncStream {
    constructor(stream, fn) {
        super();
        _AsyncMapStream_stream.set(this, void 0);
        _AsyncMapStream_fn.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncMapStream_stream, stream, "f");
        __classPrivateFieldSet(this, _AsyncMapStream_fn, fn, "f");
    }
    async nextItem() {
        const item = await __classPrivateFieldGet(this, _AsyncMapStream_stream, "f").nextItem();
        if (!("i" in item))
            return item;
        try {
            return StreamItem.item(await __classPrivateFieldGet(this, _AsyncMapStream_fn, "f").call(this, item.i));
        }
        catch (e) {
            return StreamItem.error(e);
        }
    }
}
_AsyncMapStream_stream = new WeakMap(), _AsyncMapStream_fn = new WeakMap();
class SyncFlatMapStream extends SyncStream {
    constructor(stream, fn) {
        super();
        _SyncFlatMapStream_current.set(this, null);
        _SyncFlatMapStream_stream.set(this, void 0);
        _SyncFlatMapStream_fn.set(this, void 0);
        __classPrivateFieldSet(this, _SyncFlatMapStream_stream, stream, "f");
        __classPrivateFieldSet(this, _SyncFlatMapStream_fn, fn, "f");
    }
    nextItem() {
        try {
            while (1) {
                if (!__classPrivateFieldGet(this, _SyncFlatMapStream_current, "f")) {
                    const item = __classPrivateFieldGet(this, _SyncFlatMapStream_stream, "f").nextItem();
                    if (!("i" in item))
                        return item;
                    const it = __classPrivateFieldGet(this, _SyncFlatMapStream_fn, "f").call(this, item.i);
                    __classPrivateFieldSet(this, _SyncFlatMapStream_current, Symbol.iterator in it ? it[Symbol.iterator]() : it, "f");
                }
            }
            const item = StreamItem.fromResult(__classPrivateFieldGet(this, _SyncFlatMapStream_current, "f").next());
            if (!("d" in item))
                return item;
            __classPrivateFieldSet(this, _SyncFlatMapStream_current, null, "f");
        }
        catch (e) {
            return StreamItem.error(e);
        }
        throw Error("Impossible");
    }
}
_SyncFlatMapStream_current = new WeakMap(), _SyncFlatMapStream_stream = new WeakMap(), _SyncFlatMapStream_fn = new WeakMap();
class AsyncFlatMapStream extends AsyncStream {
    constructor(stream, fn) {
        super();
        _AsyncFlatMapStream_current.set(this, null);
        _AsyncFlatMapStream_stream.set(this, void 0);
        _AsyncFlatMapStream_fn.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncFlatMapStream_stream, stream, "f");
        __classPrivateFieldSet(this, _AsyncFlatMapStream_fn, fn, "f");
    }
    async nextItem() {
        try {
            while (1) {
                if (!__classPrivateFieldGet(this, _AsyncFlatMapStream_current, "f")) {
                    const item = await __classPrivateFieldGet(this, _AsyncFlatMapStream_stream, "f").nextItem();
                    if (!("i" in item))
                        return item;
                    const it = await __classPrivateFieldGet(this, _AsyncFlatMapStream_fn, "f").call(this, item.i);
                    __classPrivateFieldSet(this, _AsyncFlatMapStream_current, Symbol.iterator in it
                        ? it[Symbol.iterator]()
                        : Symbol.asyncIterator in it
                            ? it[Symbol.asyncIterator]()
                            : it, "f");
                }
            }
            const item = StreamItem.fromResult(await __classPrivateFieldGet(this, _AsyncFlatMapStream_current, "f").next());
            if (!("d" in item))
                return item;
            __classPrivateFieldSet(this, _AsyncFlatMapStream_current, null, "f");
        }
        catch (e) {
            return StreamItem.error(e);
        }
        throw Error("Impossible");
    }
}
_AsyncFlatMapStream_current = new WeakMap(), _AsyncFlatMapStream_stream = new WeakMap(), _AsyncFlatMapStream_fn = new WeakMap();
class SyncFilterStream extends SyncStream {
    constructor(stream, fn) {
        super();
        _SyncFilterStream_stream.set(this, void 0);
        _SyncFilterStream_fn.set(this, void 0);
        __classPrivateFieldSet(this, _SyncFilterStream_stream, stream, "f");
        __classPrivateFieldSet(this, _SyncFilterStream_fn, fn, "f");
    }
    nextItem() {
        try {
            while (1) {
                const item = __classPrivateFieldGet(this, _SyncFilterStream_stream, "f").nextItem();
                if (!("i" in item) || __classPrivateFieldGet(this, _SyncFilterStream_fn, "f").call(this, item.i))
                    return item;
            }
        }
        catch (e) {
            return StreamItem.error(e);
        }
        throw Error("Impossible");
    }
}
_SyncFilterStream_stream = new WeakMap(), _SyncFilterStream_fn = new WeakMap();
class AsyncFilterStream extends AsyncStream {
    constructor(stream, fn) {
        super();
        _AsyncFilterStream_stream.set(this, void 0);
        _AsyncFilterStream_fn.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncFilterStream_stream, stream, "f");
        __classPrivateFieldSet(this, _AsyncFilterStream_fn, fn, "f");
    }
    async nextItem() {
        try {
            while (1) {
                const item = await __classPrivateFieldGet(this, _AsyncFilterStream_stream, "f").nextItem();
                if (!("i" in item) || (await __classPrivateFieldGet(this, _AsyncFilterStream_fn, "f").call(this, item.i)))
                    return item;
            }
        }
        catch (e) {
            return StreamItem.error(e);
        }
        throw Error("Impossible");
    }
}
_AsyncFilterStream_stream = new WeakMap(), _AsyncFilterStream_fn = new WeakMap();
class SyncWindowStream extends SyncStream {
    constructor(stream, skip = undefined, take = undefined) {
        super();
        _SyncWindowStream_stream.set(this, void 0);
        _SyncWindowStream_skip.set(this, void 0);
        _SyncWindowStream_take.set(this, void 0);
        __classPrivateFieldSet(this, _SyncWindowStream_stream, stream, "f");
        __classPrivateFieldSet(this, _SyncWindowStream_skip, skip, "f");
        __classPrivateFieldSet(this, _SyncWindowStream_take, take, "f");
    }
    nextItem() {
        var _a, _b;
        while (__classPrivateFieldGet(this, _SyncWindowStream_skip, "f")) {
            const item = __classPrivateFieldGet(this, _SyncWindowStream_stream, "f").nextItem();
            if (!("i" in item))
                return item;
            __classPrivateFieldSet(this, _SyncWindowStream_skip, (_a = __classPrivateFieldGet(this, _SyncWindowStream_skip, "f"), _a--, _a), "f");
        }
        if (__classPrivateFieldGet(this, _SyncWindowStream_take, "f") === undefined) {
            return __classPrivateFieldGet(this, _SyncWindowStream_stream, "f").nextItem();
        }
        if (!__classPrivateFieldGet(this, _SyncWindowStream_take, "f"))
            return StreamItem.done;
        const item = __classPrivateFieldGet(this, _SyncWindowStream_stream, "f").nextItem();
        if ("i" in item)
            __classPrivateFieldSet(this, _SyncWindowStream_take, (_b = __classPrivateFieldGet(this, _SyncWindowStream_take, "f"), _b--, _b), "f");
        return item;
    }
}
_SyncWindowStream_stream = new WeakMap(), _SyncWindowStream_skip = new WeakMap(), _SyncWindowStream_take = new WeakMap();
class AsyncWindowStream extends AsyncStream {
    constructor(stream, skip = undefined, take = undefined) {
        super();
        _AsyncWindowStream_stream.set(this, void 0);
        _AsyncWindowStream_skip.set(this, void 0);
        _AsyncWindowStream_take.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncWindowStream_stream, stream, "f");
        __classPrivateFieldSet(this, _AsyncWindowStream_skip, skip, "f");
        __classPrivateFieldSet(this, _AsyncWindowStream_take, take, "f");
    }
    async nextItem() {
        var _a, _b;
        while (__classPrivateFieldGet(this, _AsyncWindowStream_skip, "f")) {
            const item = await __classPrivateFieldGet(this, _AsyncWindowStream_stream, "f").nextItem();
            if (!("i" in item))
                return item;
            __classPrivateFieldSet(this, _AsyncWindowStream_skip, (_a = __classPrivateFieldGet(this, _AsyncWindowStream_skip, "f"), _a--, _a), "f");
        }
        if (__classPrivateFieldGet(this, _AsyncWindowStream_take, "f") === undefined) {
            return __classPrivateFieldGet(this, _AsyncWindowStream_stream, "f").nextItem();
        }
        if (!__classPrivateFieldGet(this, _AsyncWindowStream_take, "f"))
            return StreamItem.done;
        const item = await __classPrivateFieldGet(this, _AsyncWindowStream_stream, "f").nextItem();
        if ("i" in item)
            __classPrivateFieldSet(this, _AsyncWindowStream_take, (_b = __classPrivateFieldGet(this, _AsyncWindowStream_take, "f"), _b--, _b), "f");
        return item;
    }
}
_AsyncWindowStream_stream = new WeakMap(), _AsyncWindowStream_skip = new WeakMap(), _AsyncWindowStream_take = new WeakMap();
class SyncFlattenStream extends SyncStream {
    constructor(stream) {
        super();
        _SyncFlattenStream_current.set(this, null);
        _SyncFlattenStream_stream.set(this, void 0);
        __classPrivateFieldSet(this, _SyncFlattenStream_stream, stream, "f");
    }
    nextItem() {
        while (1) {
            if (!__classPrivateFieldGet(this, _SyncFlattenStream_current, "f")) {
                const item = __classPrivateFieldGet(this, _SyncFlattenStream_stream, "f").nextItem();
                if (!("i" in item))
                    return item;
                __classPrivateFieldSet(this, _SyncFlattenStream_current, item.i, "f");
            }
            const item = __classPrivateFieldGet(this, _SyncFlattenStream_current, "f").nextItem();
            if (!("d" in item))
                return item;
            __classPrivateFieldSet(this, _SyncFlattenStream_current, null, "f");
        }
        throw Error("Impossible");
    }
}
_SyncFlattenStream_current = new WeakMap(), _SyncFlattenStream_stream = new WeakMap();
class AsyncFlattenStream extends AsyncStream {
    constructor(stream) {
        super();
        _AsyncFlattenStream_current.set(this, null);
        _AsyncFlattenStream_stream.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncFlattenStream_stream, stream, "f");
    }
    async nextItem() {
        while (1) {
            if (!__classPrivateFieldGet(this, _AsyncFlattenStream_current, "f")) {
                const item = await __classPrivateFieldGet(this, _AsyncFlattenStream_stream, "f").nextItem();
                if (!("i" in item))
                    return item;
                __classPrivateFieldSet(this, _AsyncFlattenStream_current, item.i.sync ? item.i.intoAsync() : item.i, "f");
            }
            const item = await __classPrivateFieldGet(this, _AsyncFlattenStream_current, "f").nextItem();
            if (!("d" in item))
                return item;
            __classPrivateFieldSet(this, _AsyncFlattenStream_current, null, "f");
        }
        throw Error("Impossible");
    }
}
_AsyncFlattenStream_current = new WeakMap(), _AsyncFlattenStream_stream = new WeakMap();
class SyncIterateStream extends SyncStream {
    constructor(fn, start) {
        super();
        _SyncIterateStream_fn.set(this, void 0);
        _SyncIterateStream_start.set(this, void 0);
        __classPrivateFieldSet(this, _SyncIterateStream_fn, fn, "f");
        __classPrivateFieldSet(this, _SyncIterateStream_start, start, "f");
    }
    nextItem() {
        var _a, _b;
        try {
            return StreamItem.item(__classPrivateFieldGet(this, _SyncIterateStream_fn, "f").call(this, (__classPrivateFieldSet(this, _SyncIterateStream_start, (_b = __classPrivateFieldGet(this, _SyncIterateStream_start, "f"), _a = _b++, _b), "f"), _a)));
        }
        catch (e) {
            return StreamItem.error(e);
        }
    }
}
_SyncIterateStream_fn = new WeakMap(), _SyncIterateStream_start = new WeakMap();
class AsyncIterateStream extends AsyncStream {
    constructor(fn, start) {
        super();
        _AsyncIterateStream_fn.set(this, void 0);
        _AsyncIterateStream_start.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncIterateStream_fn, fn, "f");
        __classPrivateFieldSet(this, _AsyncIterateStream_start, start, "f");
    }
    async nextItem() {
        var _a, _b;
        try {
            return StreamItem.item(await __classPrivateFieldGet(this, _AsyncIterateStream_fn, "f").call(this, (__classPrivateFieldSet(this, _AsyncIterateStream_start, (_b = __classPrivateFieldGet(this, _AsyncIterateStream_start, "f"), _a = _b++, _b), "f"), _a)));
        }
        catch (e) {
            return StreamItem.error(e);
        }
    }
}
_AsyncIterateStream_fn = new WeakMap(), _AsyncIterateStream_start = new WeakMap();
class AsyncDelayedStream extends AsyncStream {
    constructor(stream, ms) {
        super();
        _AsyncDelayedStream_stream.set(this, void 0);
        _AsyncDelayedStream_ms.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncDelayedStream_stream, stream, "f");
        __classPrivateFieldSet(this, _AsyncDelayedStream_ms, ms, "f");
    }
    async nextItem() {
        await new Promise((r) => setTimeout(r, __classPrivateFieldGet(this, _AsyncDelayedStream_ms, "f")));
        return __classPrivateFieldGet(this, _AsyncDelayedStream_stream, "f").nextItem();
    }
}
_AsyncDelayedStream_stream = new WeakMap(), _AsyncDelayedStream_ms = new WeakMap();
class SyncExtendStream extends SyncStream {
    constructor(s1, s2) {
        super();
        _SyncExtendStream_streams.set(this, void 0);
        _SyncExtendStream_index.set(this, 0);
        __classPrivateFieldSet(this, _SyncExtendStream_streams, [s1, s2], "f");
    }
    nextItem() {
        var _a;
        while (1) {
            const current = __classPrivateFieldGet(this, _SyncExtendStream_streams, "f")[__classPrivateFieldGet(this, _SyncExtendStream_index, "f")];
            if (!current)
                return StreamItem.done;
            const item = current.nextItem();
            if (!("d" in item))
                return item;
            __classPrivateFieldSet(this, _SyncExtendStream_index, (_a = __classPrivateFieldGet(this, _SyncExtendStream_index, "f"), _a++, _a), "f");
        }
        throw Error("Impossible");
    }
}
_SyncExtendStream_streams = new WeakMap(), _SyncExtendStream_index = new WeakMap();
class AsyncExtendStream extends AsyncStream {
    constructor(s1, s2) {
        super();
        _AsyncExtendStream_streams.set(this, void 0);
        _AsyncExtendStream_index.set(this, 0);
        __classPrivateFieldSet(this, _AsyncExtendStream_streams, [s1, s2], "f");
    }
    async nextItem() {
        var _a;
        while (1) {
            const current = __classPrivateFieldGet(this, _AsyncExtendStream_streams, "f")[__classPrivateFieldGet(this, _AsyncExtendStream_index, "f")];
            if (!current)
                return StreamItem.done;
            const item = await current.nextItem();
            if (!("d" in item))
                return item;
            __classPrivateFieldSet(this, _AsyncExtendStream_index, (_a = __classPrivateFieldGet(this, _AsyncExtendStream_index, "f"), _a++, _a), "f");
        }
        throw Error("Impossible");
    }
}
_AsyncExtendStream_streams = new WeakMap(), _AsyncExtendStream_index = new WeakMap();
class SyncMeasuringStream extends SyncStream {
    constructor(stream) {
        super();
        _SyncMeasuringStream_stream.set(this, void 0);
        __classPrivateFieldSet(this, _SyncMeasuringStream_stream, stream, "f");
    }
    nextItem() {
        const from = performance.now();
        const item = __classPrivateFieldGet(this, _SyncMeasuringStream_stream, "f").nextItem();
        if (!("i" in item))
            return item;
        return StreamItem.item([item.i, performance.now() - from]);
    }
}
_SyncMeasuringStream_stream = new WeakMap();
class AsyncMeasuredStream extends AsyncStream {
    constructor(stream) {
        super();
        _AsyncMeasuredStream_stream.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncMeasuredStream_stream, stream, "f");
    }
    async nextItem() {
        const from = performance.now();
        const item = await __classPrivateFieldGet(this, _AsyncMeasuredStream_stream, "f").nextItem();
        if (!("i" in item))
            return item;
        return StreamItem.item([item.i, performance.now() - from]);
    }
}
_AsyncMeasuredStream_stream = new WeakMap();
class SyncBatchesStream extends SyncStream {
    constructor(stream, count) {
        super();
        _SyncBatchesStream_instances.add(this);
        _SyncBatchesStream_storage.set(this, []);
        _SyncBatchesStream_done.set(this, false);
        _SyncBatchesStream_stream.set(this, void 0);
        _SyncBatchesStream_count.set(this, void 0);
        __classPrivateFieldSet(this, _SyncBatchesStream_stream, stream, "f");
        __classPrivateFieldSet(this, _SyncBatchesStream_count, count, "f");
    }
    nextItem() {
        if (__classPrivateFieldGet(this, _SyncBatchesStream_done, "f"))
            return StreamItem.done;
        while (__classPrivateFieldGet(this, _SyncBatchesStream_storage, "f").length < __classPrivateFieldGet(this, _SyncBatchesStream_count, "f")) {
            const item = __classPrivateFieldGet(this, _SyncBatchesStream_stream, "f").nextItem();
            if ("d" in item) {
                __classPrivateFieldSet(this, _SyncBatchesStream_done, true, "f");
                return StreamItem.item(__classPrivateFieldGet(this, _SyncBatchesStream_instances, "m", _SyncBatchesStream_swap).call(this));
            }
            if ("e" in item)
                return item;
            __classPrivateFieldGet(this, _SyncBatchesStream_storage, "f").push(item.i);
        }
        return StreamItem.item(__classPrivateFieldGet(this, _SyncBatchesStream_instances, "m", _SyncBatchesStream_swap).call(this));
    }
}
_SyncBatchesStream_storage = new WeakMap(), _SyncBatchesStream_done = new WeakMap(), _SyncBatchesStream_stream = new WeakMap(), _SyncBatchesStream_count = new WeakMap(), _SyncBatchesStream_instances = new WeakSet(), _SyncBatchesStream_swap = function _SyncBatchesStream_swap() {
    const r = __classPrivateFieldGet(this, _SyncBatchesStream_storage, "f");
    __classPrivateFieldSet(this, _SyncBatchesStream_storage, [], "f");
    return r;
};
class AsyncBatchesStream extends AsyncStream {
    constructor(stream, count) {
        super();
        _AsyncBatchesStream_instances.add(this);
        _AsyncBatchesStream_storage.set(this, []);
        _AsyncBatchesStream_done.set(this, false);
        _AsyncBatchesStream_stream.set(this, void 0);
        _AsyncBatchesStream_count.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncBatchesStream_stream, stream, "f");
        __classPrivateFieldSet(this, _AsyncBatchesStream_count, count, "f");
    }
    async nextItem() {
        if (__classPrivateFieldGet(this, _AsyncBatchesStream_done, "f"))
            return StreamItem.done;
        while (__classPrivateFieldGet(this, _AsyncBatchesStream_storage, "f").length < __classPrivateFieldGet(this, _AsyncBatchesStream_count, "f")) {
            const item = await __classPrivateFieldGet(this, _AsyncBatchesStream_stream, "f").nextItem();
            if ("d" in item) {
                __classPrivateFieldSet(this, _AsyncBatchesStream_done, true, "f");
                return StreamItem.item(__classPrivateFieldGet(this, _AsyncBatchesStream_instances, "m", _AsyncBatchesStream_swap).call(this));
            }
            if ("e" in item)
                return item;
            __classPrivateFieldGet(this, _AsyncBatchesStream_storage, "f").push(item.i);
        }
        return StreamItem.item(__classPrivateFieldGet(this, _AsyncBatchesStream_instances, "m", _AsyncBatchesStream_swap).call(this));
    }
}
_AsyncBatchesStream_storage = new WeakMap(), _AsyncBatchesStream_done = new WeakMap(), _AsyncBatchesStream_stream = new WeakMap(), _AsyncBatchesStream_count = new WeakMap(), _AsyncBatchesStream_instances = new WeakSet(), _AsyncBatchesStream_swap = function _AsyncBatchesStream_swap() {
    const r = __classPrivateFieldGet(this, _AsyncBatchesStream_storage, "f");
    __classPrivateFieldSet(this, _AsyncBatchesStream_storage, [], "f");
    return r;
};
class SyncZipStream extends SyncStream {
    constructor(as, bs, kind) {
        super();
        _SyncZipStream_instances.add(this);
        _SyncZipStream_aexhausted.set(this, false);
        _SyncZipStream_bexhausted.set(this, false);
        _SyncZipStream_next.set(this, void 0);
        _SyncZipStream_as.set(this, void 0);
        _SyncZipStream_bs.set(this, void 0);
        __classPrivateFieldSet(this, _SyncZipStream_as, as, "f");
        __classPrivateFieldSet(this, _SyncZipStream_bs, bs, "f");
        __classPrivateFieldSet(this, _SyncZipStream_next, (kind === "inner"
            ? __classPrivateFieldGet(this, _SyncZipStream_instances, "m", _SyncZipStream_inner)
            : kind === "left"
                ? __classPrivateFieldGet(this, _SyncZipStream_instances, "m", _SyncZipStream_left)
                : kind === "right"
                    ? __classPrivateFieldGet(this, _SyncZipStream_instances, "m", _SyncZipStream_right)
                    : __classPrivateFieldGet(this, _SyncZipStream_instances, "m", _SyncZipStream_full)).bind(this), "f");
    }
    nextItem() {
        return __classPrivateFieldGet(this, _SyncZipStream_next, "f").call(this);
    }
}
_SyncZipStream_aexhausted = new WeakMap(), _SyncZipStream_bexhausted = new WeakMap(), _SyncZipStream_next = new WeakMap(), _SyncZipStream_as = new WeakMap(), _SyncZipStream_bs = new WeakMap(), _SyncZipStream_instances = new WeakSet(), _SyncZipStream_inner = function _SyncZipStream_inner() {
    const i1 = __classPrivateFieldGet(this, _SyncZipStream_as, "f").nextItem();
    if (!("i" in i1))
        return i1;
    const i2 = __classPrivateFieldGet(this, _SyncZipStream_bs, "f").nextItem();
    if (!("i" in i2))
        return i2;
    return StreamItem.item([i1.i, i2.i]);
}, _SyncZipStream_left = function _SyncZipStream_left() {
    const i1 = __classPrivateFieldGet(this, _SyncZipStream_as, "f").nextItem();
    if (!("i" in i1))
        return i1;
    let i2;
    if (__classPrivateFieldGet(this, _SyncZipStream_bexhausted, "f")) {
        i2 = StreamItem.done;
    }
    else {
        i2 = __classPrivateFieldGet(this, _SyncZipStream_bs, "f").nextItem();
        if ("d" in i2)
            __classPrivateFieldSet(this, _SyncZipStream_bexhausted, true, "f");
        if ("e" in i2)
            return i2;
    }
    return StreamItem.item([i1.i, "i" in i2 ? i2.i : null]);
}, _SyncZipStream_right = function _SyncZipStream_right() {
    let i1;
    if (__classPrivateFieldGet(this, _SyncZipStream_aexhausted, "f")) {
        i1 = StreamItem.done;
    }
    else {
        i1 = __classPrivateFieldGet(this, _SyncZipStream_as, "f").nextItem();
        if ("d" in i1)
            __classPrivateFieldSet(this, _SyncZipStream_aexhausted, true, "f");
        if ("e" in i1)
            return i1;
    }
    const i2 = __classPrivateFieldGet(this, _SyncZipStream_bs, "f").nextItem();
    if (!("i" in i2))
        return i2;
    return StreamItem.item(["i" in i1 ? i1.i : null, i2.i]);
}, _SyncZipStream_full = function _SyncZipStream_full() {
    let i1;
    if (__classPrivateFieldGet(this, _SyncZipStream_aexhausted, "f")) {
        i1 = StreamItem.done;
    }
    else {
        i1 = __classPrivateFieldGet(this, _SyncZipStream_as, "f").nextItem();
        if ("d" in i1)
            __classPrivateFieldSet(this, _SyncZipStream_aexhausted, true, "f");
        if ("e" in i1)
            return i1;
    }
    let i2;
    if (__classPrivateFieldGet(this, _SyncZipStream_bexhausted, "f")) {
        i2 = StreamItem.done;
    }
    else {
        i2 = __classPrivateFieldGet(this, _SyncZipStream_bs, "f").nextItem();
        if ("d" in i2)
            __classPrivateFieldSet(this, _SyncZipStream_bexhausted, true, "f");
        if ("e" in i2)
            return i2;
    }
    if (__classPrivateFieldGet(this, _SyncZipStream_aexhausted, "f") && __classPrivateFieldGet(this, _SyncZipStream_bexhausted, "f"))
        return StreamItem.done;
    return StreamItem.item([
        "i" in i1 ? i1.i : null,
        "i" in i2 ? i2.i : null,
    ]);
};
class AsyncZipStream extends AsyncStream {
    constructor(as, bs, kind) {
        super();
        _AsyncZipStream_instances.add(this);
        _AsyncZipStream_aexhausted.set(this, false);
        _AsyncZipStream_bexhausted.set(this, false);
        _AsyncZipStream_next.set(this, void 0);
        _AsyncZipStream_as.set(this, void 0);
        _AsyncZipStream_bs.set(this, void 0);
        __classPrivateFieldSet(this, _AsyncZipStream_as, as, "f");
        __classPrivateFieldSet(this, _AsyncZipStream_bs, bs, "f");
        __classPrivateFieldSet(this, _AsyncZipStream_next, (kind === "inner"
            ? __classPrivateFieldGet(this, _AsyncZipStream_instances, "m", _AsyncZipStream_inner)
            : kind === "left"
                ? __classPrivateFieldGet(this, _AsyncZipStream_instances, "m", _AsyncZipStream_left)
                : kind === "right"
                    ? __classPrivateFieldGet(this, _AsyncZipStream_instances, "m", _AsyncZipStream_right)
                    : __classPrivateFieldGet(this, _AsyncZipStream_instances, "m", _AsyncZipStream_full)).bind(this), "f");
    }
    nextItem() {
        return __classPrivateFieldGet(this, _AsyncZipStream_next, "f").call(this);
    }
}
_AsyncZipStream_aexhausted = new WeakMap(), _AsyncZipStream_bexhausted = new WeakMap(), _AsyncZipStream_next = new WeakMap(), _AsyncZipStream_as = new WeakMap(), _AsyncZipStream_bs = new WeakMap(), _AsyncZipStream_instances = new WeakSet(), _AsyncZipStream_inner = async function _AsyncZipStream_inner() {
    const i1 = await __classPrivateFieldGet(this, _AsyncZipStream_as, "f").nextItem();
    if (!("i" in i1))
        return i1;
    const i2 = await __classPrivateFieldGet(this, _AsyncZipStream_bs, "f").nextItem();
    if (!("i" in i2))
        return i2;
    return StreamItem.item([i1.i, i2.i]);
}, _AsyncZipStream_left = async function _AsyncZipStream_left() {
    const i1 = await __classPrivateFieldGet(this, _AsyncZipStream_as, "f").nextItem();
    if (!("i" in i1))
        return i1;
    let i2;
    if (__classPrivateFieldGet(this, _AsyncZipStream_bexhausted, "f")) {
        i2 = StreamItem.done;
    }
    else {
        i2 = await __classPrivateFieldGet(this, _AsyncZipStream_bs, "f").nextItem();
        if ("d" in i2)
            __classPrivateFieldSet(this, _AsyncZipStream_bexhausted, true, "f");
        if ("e" in i2)
            return i2;
    }
    return StreamItem.item([i1.i, "i" in i2 ? i2.i : null]);
}, _AsyncZipStream_right = async function _AsyncZipStream_right() {
    let i1;
    if (__classPrivateFieldGet(this, _AsyncZipStream_aexhausted, "f")) {
        i1 = StreamItem.done;
    }
    else {
        i1 = await __classPrivateFieldGet(this, _AsyncZipStream_as, "f").nextItem();
        if ("d" in i1)
            __classPrivateFieldSet(this, _AsyncZipStream_aexhausted, true, "f");
        if ("e" in i1)
            return i1;
    }
    const i2 = await __classPrivateFieldGet(this, _AsyncZipStream_bs, "f").nextItem();
    if (!("i" in i2))
        return i2;
    return StreamItem.item(["i" in i1 ? i1.i : null, i2.i]);
}, _AsyncZipStream_full = async function _AsyncZipStream_full() {
    let i1;
    if (__classPrivateFieldGet(this, _AsyncZipStream_aexhausted, "f")) {
        i1 = StreamItem.done;
    }
    else {
        i1 = await __classPrivateFieldGet(this, _AsyncZipStream_as, "f").nextItem();
        if ("d" in i1)
            __classPrivateFieldSet(this, _AsyncZipStream_aexhausted, true, "f");
        if ("e" in i1)
            return i1;
    }
    let i2;
    if (__classPrivateFieldGet(this, _AsyncZipStream_bexhausted, "f")) {
        i2 = StreamItem.done;
    }
    else {
        i2 = await __classPrivateFieldGet(this, _AsyncZipStream_bs, "f").nextItem();
        if ("d" in i2)
            __classPrivateFieldSet(this, _AsyncZipStream_bexhausted, true, "f");
        if ("e" in i2)
            return i2;
    }
    if (__classPrivateFieldGet(this, _AsyncZipStream_aexhausted, "f") && __classPrivateFieldGet(this, _AsyncZipStream_bexhausted, "f"))
        return StreamItem.done;
    return StreamItem.item([
        "i" in i1 ? i1.i : null,
        "i" in i2 ? i2.i : null,
    ]);
};
//# sourceMappingURL=index.js.map