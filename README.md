toy-streams is a library for managing streams. Inspired by Java's Stream API.

A stream is an abstraction over a collection of lazily evaluated values. It is essentially an abstraction over an iterator or generator (or their asynchronous versions). By default, streams are fail-fast, but you can push errors out to the user space with `Stream.attempt()`.

You can start by installing with npm

```
npm i toy-streams
```

Then, import the static object with factory methods
```ts
import Stream from "you-streams";
```

This object allows you to create a stream from any object that has a `[Symbol.iterator]`, `[Symbol.asyncIterator]`, or `next` method that satisfies the iterator contract.

```ts
const array = [1]

function* syncGenerator() {
yield 1;
}

async function* asyncGenerator() {
yield 1;
}

// From array

const a = Stream.sync(array)

// From generator
const b = Stream.sync(syncGenerator())

// From async generator
const c = Stream.async(asyncGenerator())

// From accumulator and function (acc) => [yieldVal, newAcc]
const d = Stream.iterate(x => [x * 2, x], x)

// Returns errors passed as argument
const e = Stream.fail([new Error()])
```

For more information, refer to the documentation and autocomplete. I would also like to note that some methods are only available in an asynchronous stream. To make an asynchronous stream, call `_.async()`.

Project Github: https://github.com/decatile/toy-streams

If you want to implement new functionality or fix the current one, open an issue without a shadow of a doubt.

A toy remains a toy - everything else is at your own risk.