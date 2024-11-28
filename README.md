# toy-streams

**toy-streams** is a small library for managing synchronous and asynchronous data streams.  

At its core, it is an add-on over synchronous and asynchronous iterators with error management and a bunch of combinators for any case.  

The key concept of the library is `Stream` — a sequence of lazily calculated values. Depending on how the values are calculated, the `Stream` can be either synchronous or asynchronous. Moreover, each `Stream` itself is an iterator of synchronous or asynchronous type.  

I recommend using **TypeScript** for type correctness, as it's easy to make mistakes when working with functionality of this type.  

The library is released in both **CommonJS** and **ES6** formats.  

## Installation

First, install the library and import a static object to wrap various values in the stream:

```bash
npm i toy-streams
```

## Usage

Import the library and create a synchronous or asynchronous stream:

```js
import Stream from 'toy-streams';

// Synchronous stream based on the iterator
const syncStream: SyncStreamOps<number> = Stream.sync([1, 2, 3]);

// Asynchronous stream based on an iterator, but when pulling values, the promise resolves first
const asyncStream: AsyncStreamOps<number> = Stream.gather([Promise.resolve(1)]);
```

### Example: Delayed Join Operation

Before each pull, it waits for a timeout (100ms), performs a (`zip(stream<A>, stream<B>) -> stream<[A, B]>`) operation with the condition that until both streams exhaust themselves, the values will continue to arrive. If one of the streams has ended, `null` will be returned in place of its result. Iterate through the entire stream and apply a callback to each element.

```js
syncStream
  .delayed(100)
  .join(asyncStream, 'full')
  .forEach(console.log);
```

## Features

- Synchronous and asynchronous stream support
- Error handling and robust combinators
- Fully typed and documented for easy integration

## Contributing

If you want to contribute to the project, you are welcome to my [GitHub](https://github.com/yourusername/toy-streams).

---

Happy streaming! 🚀
