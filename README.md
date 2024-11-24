# toy-streams: A Streaming Framework for JavaScript

`toy-streams` is a modern and flexible streaming framework designed to handle both synchronous and asynchronous data flows in a consistent, declarative, and functional manner. It provides a unified interface for creating, transforming, and managing streams of data, inspired by popular functional programming concepts such as map, flatMap, filter, and reduce.

This library makes it easy to work with data sources in both synchronous and asynchronous contexts, from simple arrays and iterators to promises, asynchronous iterators, and streams of streams.

## Table of Contents

- [Installation](#installation)
- [Concepts](#concepts)
  - [Sync vs Async Streams](#sync-vs-async-streams)
  - [Streams](#streams)
  - [Stream Operations](#stream-operations)
- [Usage Examples](#usage-examples)
  - [Basic Streams](#basic-streams)
  - [Mapping](#mapping)
  - [FlatMapping](#flatmapping)
  - [Filtering](#filtering)
  - [Reducing](#reducing)
  - [Batches](#batches)
  - [Windowing](#windowing)
  - [Async Operations](#async-operations)
  - [Stream Extensions](#stream-extensions)
  - [Performance Measurement](#performance-measurement)
- [API Reference](#api-reference)
  - [Stream API](#stream-api)
  - [SyncStream API](#syncstream-api)
  - [AsyncStream API](#asyncstream-api)

---

## Installation

To install `toy-streams`, you can use npm or yarn:

```bash
npm install toy-streams
# or
yarn add toy-streams
```

---

## Concepts

### Sync vs Async Streams

- **SyncStream**: Represents a stream of data that is computed synchronously. It is an iterable, meaning you can use `for...of` loops to consume it.
- **AsyncStream**: Represents a stream of data that is computed asynchronously (i.e., it returns Promises or uses async iterators). You can use `for await...of` loops to consume it.

A key feature of `toy-streams` is the ability to seamlessly work with both types of streams. Many operations like `map`, `filter`, and `flatMap` are available for both sync and async streams.

---

### Streams

A `Stream` is an abstraction over a sequence of data. The base class for all streams is `Stream<S>`, where `S` is a type that indicates whether the stream is synchronous (`true`) or asynchronous (`false`).

You can create streams using static methods like `Stream.once`, `Stream.sync`, `Stream.async`, etc.

Example of creating a stream:

```typescript
import Stream from 'toy-streams';

// Synchronous stream
const syncStream = Stream.sync([1, 2, 3]);

// Asynchronous stream
const asyncStream = Stream.async(async function* () {
  yield 1;
  yield 2;
  yield 3;
});
```

---

### Stream Operations

Streams support a wide range of operations that allow you to transform and manipulate the data they produce.

1. **Mapping**: Apply a function to each item in the stream.
2. **FlatMapping**: Flatten the result of a function applied to each item.
3. **Filtering**: Keep items that match a condition.
4. **Reducing**: Accumulate values into a single result.
5. **Batches**: Group items into batches.
6. **Windowing**: Create windows over a stream.

---

## Usage Examples

### Basic Streams

```typescript
import Stream from 'toy-streams';

// Create a synchronous stream from an array
const syncStream = Stream.sync([1, 2, 3]);

// Create an asynchronous stream
const asyncStream = Stream.async(async function* () {
  yield 1;
  yield 2;
  yield 3;
});
```

### Mapping

Transform the data in the stream.

```typescript
// Synchronous stream map
const mappedSyncStream = syncStream.map((x) => x * 2);
console.log([...mappedSyncStream]); // [2, 4, 6]

// Asynchronous stream map
const mappedAsyncStream = asyncStream.map(async (x) => x * 2);
const result = await mappedAsyncStream.collect();
console.log(result); // [2, 4, 6]
```

### FlatMapping

Flatten the results of applying a function to each element.

```typescript
// Synchronous flatMap
const flatMappedSyncStream = syncStream.flatMap((x) => [x, x + 1]);
console.log([...flatMappedSyncStream]); // [1, 2, 2, 3, 3, 4]

// Asynchronous flatMap
const flatMappedAsyncStream = asyncStream.flatMap(async (x) => [x, x + 1]);
const asyncResult = await flatMappedAsyncStream.collect();
console.log(asyncResult); // [1, 2, 2, 3, 3, 4]
```

### Filtering

Keep only the items that pass the condition.

```typescript
// Synchronous filter
const filteredSyncStream = syncStream.filter((x) => x % 2 === 0);
console.log([...filteredSyncStream]); // [2]

// Asynchronous filter
const filteredAsyncStream = asyncStream.filter(async (x) => x % 2 === 0);
const asyncFilteredResult = await filteredAsyncStream.collect();
console.log(asyncFilteredResult); // [2]
```

### Reducing

Accumulate values into a single result.

```typescript
// Synchronous reduce
const reducedSyncStream = syncStream.reduce((acc, x) => acc + x, 0);
console.log(reducedSyncStream); // 6

// Asynchronous reduce
const reducedAsyncStream = await asyncStream.reduce(async (acc, x) => acc + x, 0);
console.log(reducedAsyncStream); // 6
```

### Batches

Group items into batches.

```typescript
// Synchronous batches
const batchedSyncStream = syncStream.batches(2);
console.log([...batchedSyncStream]); // [[1, 2], [3]]

// Asynchronous batches
const batchedAsyncStream = asyncStream.batches(2);
const asyncBatchedResult = await batchedAsyncStream.collect();
console.log(asyncBatchedResult); // [[1, 2], [3]]
```

### Windowing

Create windows over the stream, with optional skip and take parameters.

```typescript
// Synchronous window
const windowedSyncStream = syncStream.window({ skip: 1, take: 2 });
console.log([...windowedSyncStream]); // [2, 3]

// Asynchronous window
const windowedAsyncStream = asyncStream.window({ skip: 1, take: 2 });
const asyncWindowedResult = await windowedAsyncStream.collect();
console.log(asyncWindowedResult); // [2, 3]
```

### Async Operations

You can use async operations like `forEach`, `reduce`, and `collect` in asynchronous streams.

```typescript
// Asynchronous forEach
await asyncStream.forEach(async (x) => {
  console.log(x);
});

// Asynchronous collect
const collectedAsyncResult = await asyncStream.collect();
console.log(collectedAsyncResult); // [1, 2, 3]
```

### Stream Extensions

You can extend one stream with another, combining them.

```typescript
// Synchronous extend
const extendedSyncStream = syncStream.extend(Stream.sync([4, 5]));
console.log([...extendedSyncStream]); // [1, 2, 3, 4, 5]

// Asynchronous extend
const extendedAsyncStream = asyncStream.extend(Stream.async(async function* () {
  yield 4;
  yield 5;
}));
const extendedAsyncResult = await extendedAsyncStream.collect();
console.log(extendedAsyncResult); // [1, 2, 3, 4, 5]
```

### Performance Measurement

Measure the time taken to process each item in the stream.

```typescript
// Synchronous measurement
const measuringSyncStream = syncStream.measuring();
console.log([...measuringSyncStream]); // [[1, time], [2, time], [3, time]]

// Asynchronous measurement
const measuringAsyncStream = asyncStream.measuring();
const asyncMeasuredResult = await measuringAsyncStream.collect();
console.log(asyncMeasuredResult); // [[1, time], [2, time], [3, time]]
```

---

## API Reference

### Stream API

- `Stream.once(x: T)` - Creates a stream with a single item.
- `Stream.sync(it: Iterable<T> | Iterator<T>)` - Creates a synchronous stream from an iterable or iterator.
- `Stream.async(it: AsyncIterable<T> | AsyncIterator<T>)` - Creates an asynchronous stream from an async iterable or iterator.
- `Stream.flatten(it: SyncStream<SyncStream<T>> | AsyncStream<SyncStream<T> | AsyncStream<T>>)`: Flattens a stream of streams.
- `Stream.iterate(fn: (a: number) => T, start: number = 0)` - Creates a stream by iterating a function.
- `Stream.iterateAsync(fn: (a: number) => T | Promise<T>, start: number = 0)` - Creates an asynchronous stream by iterating a function.

### SyncStream API

- `map(fn: (a: T) => T1)` - Transforms the stream by applying a function.
- `flatMap(fn: (a: T) => Iterable<T1> | Iterator<T1>)` - Flattens the results of applying a function.
- `filter(fn: (a: T)

 => boolean)` - Filters out elements that do not match the condition.
- `reduce(fn: (acc: T, item: T) => T, init: T)` - Reduces the stream to a single value.
- `batches(size: number)` - Groups items into batches.
- `window(options: {skip: number, take: number})` - Creates windows over the stream.
- `extend(stream: SyncStream<T>)` - Extends the stream by adding more items.
- `measuring()` - Measures the performance of the stream.

### AsyncStream API

- `map(fn: (a: T) => T1 | Promise<T1>)` - Transforms the stream by applying a function asynchronously.
- `flatMap(fn: (a: T) => AsyncIterable<T1> | AsyncIterator<T1>)` - Flattens the results asynchronously.
- `filter(fn: (a: T) => boolean | Promise<boolean>)` - Filters asynchronously.
- `reduce(fn: (acc: T, item: T) => T | Promise<T>, init: T)` - Reduces asynchronously.
- `batches(size: number)` - Groups asynchronously.
- `window(options: {skip: number, take: number})` - Creates windows asynchronously.
- `extend(stream: AsyncStream<T>)` - Extends the stream asynchronously.

---

By providing these powerful abstractions and methods, `toy-streams` helps you manage complex data pipelines in both synchronous and asynchronous environments with ease.