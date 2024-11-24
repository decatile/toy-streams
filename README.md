# Stream Framework

This is a JavaScript framework for working with synchronous and asynchronous streams. It provides a unified API for iterating, transforming, filtering, and combining streams of data. The framework supports both synchronous and asynchronous iterables and iterators.

## Table of Contents
- [Overview](#overview)
- [Stream Classes](#stream-classes)
  - [SyncStream](#syncstream)
  - [AsyncStream](#asyncstream)
- [Static Methods](#static-methods)
- [Instance Methods](#instance-methods)
- [Examples](#examples)
  - [Basic Usage](#basic-usage)
  - [Mapping and Transforming](#mapping-and-transforming)
  - [Flattening](#flattening)
  - [Async Operations](#async-operations)
  - [Batching](#batching)
  - [Measuring](#measuring)

## Overview

The `Stream` framework defines a set of classes for working with sequences of data in both synchronous and asynchronous contexts. You can create streams from iterables or iterators, transform them, filter values, and combine multiple streams together.

Streams in this framework implement standard iteration protocols (`Symbol.iterator` for sync and `Symbol.asyncIterator` for async), making them compatible with most JavaScript iteration tools such as `for...of`, `Array.from()`, and `async/await`.

### Key Concepts
- **SyncStream**: A stream that processes data synchronously. It implements the `Iterable` and `Iterator` interfaces.
- **AsyncStream**: A stream that processes data asynchronously. It implements the `AsyncIterable` and `AsyncIterator` interfaces.

---

## Stream Classes

### SyncStream

`SyncStream` is the base class for working with synchronous streams. It implements both `Iterable` and `Iterator`.

#### Common Methods for `SyncStream`:
- `map(fn)`: Transforms each value in the stream.
- `flatMap(fn)`: Flattens the stream by mapping each value to another iterable.
- `filter(fn)`: Filters values in the stream based on a predicate function.
- `window({ skip, take })`: Partitions the stream into windows of elements.
- `forEach(fn)`: Iterates over the stream, executing the provided function for each element.
- `reduce(fn, init)`: Reduces the stream to a single value.
- `collect()`: Collects the stream into an array.
- `batches(n)`: Groups the stream into batches of size `n`.

### AsyncStream

`AsyncStream` is the base class for asynchronous streams. It implements both `AsyncIterable` and `AsyncIterator`.

#### Common Methods for `AsyncStream`:
- `map(fn)`: Transforms each value in the stream asynchronously.
- `flatMap(fn)`: Flattens the stream asynchronously by mapping each value to another iterable.
- `filter(fn)`: Filters values asynchronously based on a predicate.
- `window(skip, take)`: Partitions the stream asynchronously into windows of elements.
- `forEach(fn)`: Iterates asynchronously over the stream.
- `reduce(fn, init)`: Reduces the stream asynchronously to a single value.
- `collect()`: Collects the stream into an array asynchronously.
- `delayed(ms)`: Delays each value in the stream by `ms` milliseconds.

---

## Static Methods

The `Stream` class provides several static methods to create streams from various sources.

### `Stream.once(fn)`

Creates a stream that emits a single value when invoked.

```js
const stream = Stream.once(() => 42);
stream.forEach(value => console.log(value)); // 42
```

### `Stream.onceAsync(fn)`

Creates an asynchronous stream that emits a single value when resolved.

```js
const stream = Stream.onceAsync(() => Promise.resolve(42));
stream.forEach(value => console.log(value)); // 42
```

### `Stream.moreAsync(fn)`

Creates an asynchronous stream that fetches more data when required.

```js
const stream = Stream.moreAsync(() => Promise.resolve([1, 2, 3]));
stream.forEach(value => console.log(value)); // 1, 2, 3
```

### `Stream.sync(it)`

Creates a synchronous stream from an iterable or iterator.

```js
const stream = Stream.sync([1, 2, 3]);
stream.forEach(value => console.log(value)); // 1, 2, 3
```

### `Stream.async(it)`

Creates an asynchronous stream from an async iterable or async iterator.

```js
const stream = Stream.async((async function*() {
  yield 1;
  yield 2;
  yield 3;
})());
stream.forEach(value => console.log(value)); // 1, 2, 3
```

### `Stream.gather(it)`

Creates an asynchronous stream that waits for promises to resolve before emitting values.

```js
const stream = Stream.gather([Promise.resolve(1), Promise.resolve(2)]);
stream.forEach(value => console.log(value)); // 1, 2
```

### `Stream.flatten(it)`

Flattens nested streams into a single stream.

```js
const stream = Stream.flatten(
  Stream.sync([Stream.sync([1, 2]), Stream.sync([3, 4])])
);
stream.forEach(value => console.log(value)); // 1, 2, 3, 4
```

### `Stream.iterate(fn, start)`

Creates a stream by repeatedly invoking a function `fn` with a starting value.

```js
const stream = Stream.iterate(n => n * 2, 1);
stream.take(5).forEach(value => console.log(value)); // 1, 2, 4, 8, 16
```

### `Stream.iterateAsync(fn, start)`

Creates an asynchronous stream by repeatedly invoking an async function `fn`.

```js
const stream = Stream.iterateAsync(n => Promise.resolve(n * 2), 1);
stream.take(5).forEach(value => console.log(value)); // 1, 2, 4, 8, 16
```

---

## Instance Methods

These methods are available on both `SyncStream` and `AsyncStream` classes.

### `map(fn)`

Applies a transformation to each value in the stream.

```js
const stream = Stream.sync([1, 2, 3]);
stream.map(x => x * 2).forEach(value => console.log(value)); // 2, 4, 6
```

### `filter(fn)`

Filters out values from the stream based on a predicate.

```js
const stream = Stream.sync([1, 2, 3, 4, 5]);
stream.filter(x => x % 2 === 0).forEach(value => console.log(value)); // 2, 4
```

### `flatMap(fn)`

Flattens the stream by applying a function that returns an iterable.

```js
const stream = Stream.sync([1, 2, 3]);
stream.flatMap(x => [x, x * 2]).forEach(value => console.log(value)); // 1, 2, 2, 4, 3, 6
```

### `forEach(fn)`

Iterates through the stream and applies the provided function to each value.

```js
const stream = Stream.sync([1, 2, 3]);
stream.forEach(value => console.log(value)); // 1, 2, 3
```

### `reduce(fn, init)`

Reduces the stream to a single value based on the provided accumulator function.

```js
const stream = Stream.sync([1, 2, 3, 4]);
const sum = stream.reduce((a, b) => a + b, 0);
console.log(sum); // 10
```

### `collect()`

Collects all values in the stream into an array.

```js
const stream = Stream.sync([1, 2, 3]);
const values = stream.collect();
console.log(values); // [1, 2, 3]
```

---

## Examples

### Basic Usage

Create a basic synchronous stream from an array and iterate over its values:

```js
const stream = Stream.sync([1, 2, 3, 4, 5]);
stream.forEach(value => console.log(value)); // 1, 2, 3, 4, 5
```

### Mapping and Transforming

Map each value to its square:

```js
const stream = Stream.sync([1, 2, 3, 4, 5]);
stream.map(x => x * x).forEach(value => console.log(value)); // 1, 4, 9, 16, 25
```

### Flattening

Flatten a stream of streams:

```js
const stream = Stream.flatten(Stream.sync([Stream.sync([1, 2]), Stream.sync([3, 4])]));
stream.forEach(value => console.log(value)); // 1, 2, 3, 4
```

### Async Operations

Create an asynchronous stream and use `forEach` with `await`:

```js
const asyncStream = Stream.async((async function*() {
  yield 1;
  yield 2;
  yield 3;
})());
asyncStream.forEach(value => console.log(value)); // 1, 2, 3
```

### Batching

Batch values into groups of three:

```js
const stream = Stream.sync([1, 2, 3, 4, 5, 6]);
