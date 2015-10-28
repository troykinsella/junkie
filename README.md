# junkie [![NPM version][npm-image]][npm-url]
> An extensible dependency injection container for node.js.

Documentation coming soon!

## Install

```sh
$ npm install --save junkie
```

## TL;DR
(because there's nothing else to read)

```js
var c = require('junkie').newContainer();

c.register("A", "thing");
c.resolve("A"); // -> "thing"

c.register("A", A).with.constructor();
c.resolve("A"); // -> instanceof A

c.register("A", A).inject("B").with.constructor();
c.register("B", B).with.constructor();
c.resolve("A"); // -> instance a was created by passing an instance of B into A's constructor 

c.register("A", AFactory).inject("B").as.factory();
c.register("B", B).with.construtor();
c.resolve("A"); // -> result of calling AFatory with an instance of B

c.register("A", A).with.constructor().with.caching();
c.resolve("A") === c.resolve("A"); // -> true

```

## Testing

```sh
$ gulp
```

## License

MIT © [Troy Kinsella]()

[npm-image]: https://badge.fury.io/js/junkie.svg
[npm-url]: https://npmjs.org/package/junkie
