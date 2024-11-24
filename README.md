# Stream Library README

## Overview

This library provides an abstraction for working with both synchronous and asynchronous streams. A stream represents a sequence of values that can be lazily evaluated. The library supports operations such as mapping, filtering, flat-mapping, reducing, and windowing over streams, along with the ability to handle both synchronous and asynchronous data sources seamlessly.

## Key Features

- **Synchronous and Asynchronous Streams:** The library distinguishes between synchronous and asynchronous streams, enabling you to work with both types using the same API.
- **Stream Composition:** You can compose streams using operations like `map`, `flatMap`, `filter`, `window`, `reduce`, etc., for both sync and async data.
- **Transformation:** Supports mapping and flat-mapping of elements with synchronous and asynchronous functions.
- **Measurement:** Tracks the time taken to process each element with `measuring`.
- **Stream Expansion:** Allows merging multiple streams together with `extend`.
- **Lazy Evaluation:** Elements are evaluated lazily, meaning values are produced only when needed.
- **Flattening:** You can flatten nested streams, whether sync or async.

## Types of Streams

- **SyncStream**: A stream that operates synchronously.
- **AsyncStream**: A stream that operates asynchronously.
- **Stream**: Base class, with a `sync` flag determining if the stream is synchronous or asynchronous.

## Installation

To install this library, use the following command:

```bash
npm install toy-streams
```

## Basic Usage

### Synchronous Streams

Create a stream from an iterable:

```typescript
import Stream from 'toy-streams';

// Create a synchronous stream from an array
const stream = Stream.sync([1, 2, 3, 4, 5]);

// Map operation: Multiply each value by 2
const mappedStream = stream.map((x) => x * 2);

// Collect the values into an array
console.log(mappedStream.collect());  // [2, 4, 6, 8, 10]
```

### Asynchronous Streams

Create a stream from an asynchronous iterable:

```typescript
import Stream from 'toy-streams';

// Create an asynchronous stream from an async iterable
const asyncStream = Stream.async({
  async *[Symbol.asyncIterator]() {
    yield 1;
    yield 2;
    yield 3;
  }
});

// Map operation: Multiply each value by 2 asynchronously
const asyncMappedStream = asyncStream.mapAsync((x) => Promise.resolve(x * 2));

// Collect the values into an array asynchronously
async function collectAsync() {
  const result = await asyncMappedStream.collect();
  console.log(result);  // [2, 4, 6]
}

collectAsync();
```

### Combining Streams (Extend)

You can combine multiple streams into one using `extend`.

```typescript
import Stream from 'toy-streams';

const stream1 = Stream.sync([1, 2, 3]);
const stream2 = Stream.sync([4, 5, 6]);

// Extend stream1 with stream2
const extendedStream = stream1.extend(stream2);

console.log(extendedStream.collect());  // [1, 2, 3, 4, 5, 6]
```

### Iterating Over a Stream

You can iterate over a stream using the `forEach` method.

```typescript
import Stream from 'toy-streams';

const stream = Stream.sync([1, 2, 3]);

// For each element, log the value
stream.forEach((value) => {
  console.log(value);  // 1, 2, 3
});
```

### Windowing

Window is a combination of skip + take

```typescript
import Stream from 'toy-streams';

const stream = Stream.sync([1, 2, 3, 4, 5]);

// Create a window with a skip of 1 and a take of 2
const windowedStream = stream.window(1, 2);

console.log(windowedStream.collect());  // [2, 3]
```

### Reduce

Reduce the stream to a single value by applying a function.

```typescript
import Stream from 'toy-streams';

const stream = Stream.sync([1, 2, 3, 4]);

// Sum the values using reduce
const sum = stream.reduce((a, b) => a + b, 0);

console.log(sum);  // 10
```

### Delayed Execution

You can introduce delays in processing stream elements using `delayed`.

```typescript
import Stream from 'toy-streams';

const stream = Stream.async({
  async *[Symbol.asyncIterator]() {
    yield 1;
    yield 2;
    yield 3;
  }
});

// Introduce a 1-second delay for each element
const delayedStream = stream.delayed(1000);

async function processDelayed() {
  for await (const value of delayedStream) {
    console.log(value);  // Logs values with a delay of 1 second between each
  }
}

processDelayed();
```

### Measuring Performance

Measure the time it takes to process each element in the stream:

```typescript
import Stream from 'toy-streams';

const stream = Stream.sync([1, 2, 3, 4, 5]);

// Measure the time taken for each element
const measuringStream = stream.measuring();

console.log(measuringStream.collect());  // [ [1, time], [2, time], ... ]
```

## API

### Stream Class Methods

- `Stream.once(fn)`: Creates a stream from a function that is called only once.
- `Stream.onceAsync(fn)`: Creates an asynchronous stream from a function that is called only once.
- `Stream.sync(it)`: Creates a synchronous stream from an iterable or iterator.
- `Stream.async(it)`: Creates an asynchronous stream from an async iterable or async iterator.
- `Stream.gather(it)`: Creates a stream that gathers the results of promises from an iterable/iterator.
- `Stream.flatten(it)`: Flattens nested streams (either sync or async).
- `Stream.iterate(fn, start)`: Creates an infinite synchronous stream starting at `start`, applying the `fn` function.
- `Stream.iterateAsync(fn, start)`: Creates an infinite asynchronous stream starting at `start`, applying the `fn` function.

### SyncStream and AsyncStream Methods

- `map(fn)`: Maps over each element, returning a new stream.
- `flatMap(fn)`: Flattens and maps over each element, returning a new stream.
- `filter(fn)`: Filters the stream based on a predicate function.
- `window(skip, take)`: Creates a sliding window over the stream.
- `forEach(fn)`: Applies a function to each element of the stream.
- `delayed(ms)`: Adds a delay (in milliseconds) to each stream element.
- `extend(other)`: Merges the current stream with another stream (either sync or async).
- `reduce(fn, init)`: Reduces the stream to a single value using the provided function.
- `collect()`: Collects all elements into an array.
- `measuring()`: Measures the time taken to process each element.

## Conclusion

This library provides a powerful and flexible API to work with both synchronous and asynchronous streams. Whether you're dealing with iterables, async iterables, or streams of promises, this library allows for composing and manipulating streams with ease.

