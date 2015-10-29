# junkie [![NPM version][npm-image]][npm-url] [![Build Status](https://travis-ci.org/troykinsella/junkie.svg?branch=master)](https://travis-ci.org/troykinsella/junkie)
> An extensible dependency injection container for node.js.

## Dependency Injection?

Many others have talked about the concept of [dependency injection](http://lmgtfy.com/?q=dependency+injection)
and [inversion of control](http://lmgtfy.com/?q=inversion+of+control).

Google on, nerdy brethren!

## Why Junkie?

There are a [slew](https://www.npmjs.com/search?q=dependency+injection) of other dependency injection (DI) modules available for node.js of
varying quality and states of abandonment. Some do a lot, such as encompass the module loading mechanism, and others do very little,
providing a fixed idea of how DI should occur.

Junkie aims to solve the problem of how to inject dependencies. No more. No less. It isn't an application framework.
It doesn't care how your modules were loaded, and it doesn't demand any Junkie awareness or specific coding styles
of your modules.

## Getting Started

### TL;DR

```js
var c = require('junkie').newContainer();

// Register a component for key "A"
c.register("A", "thing");

// Resolve a component for key "A"
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

### Installation

Nothing special:
```sh
$ npm install --save junkie
```

### Components

Many components are managed by a junkie container. There's nothing special about a component; it can be any data type.
A component is registered with the container by a key, and the construction of that component can be resolved
and returned by the same key.

Here is the simplest example possible:
```js
var junkie = require('junkie');
var container = junkie.newContainer();

var MyComponent = "awesome";
container.register("MyComponent", MyComponent);

var myComponent = container.resolve("MyComponent");
console.log(myComponent === MyComponent); // prints 'true'
```

### Injectors

An injector is responsible for stuffing dependencies into your component.
Junkie ships with a variety of injection capabilities, but if none fit the bill, you can define your own.
An injector will either create an instance of your component, or it will modify the existing instance.
A component can be configured with multiple injectors, but only one kind of injector that creates
component instances is allowed for a single component.

#### Constructor Injection

The constructor injector creates a new component instance by passing dependencies into a constructor.

```js
function Type(message) {
  this.message = message;
}

container.register("Type", Type).inject("Message").into.constructor();
container.register("Message", "hello");

var instance = container.resolve("Type");
console.log(instance.message); // prints "hello"
```

The container resolve performs the following equivalent in plain JS:
```js
var instance = new Type("hello");
```

#### Factory Injection

The factory injector obtains a component instance by calling a function with dependencies.

```js
function factory(message) {
  return {
    message: message
  };
}

container.register("Type", factory).inject("Message").into.factory();
container.register("Message", "hello");

var instance = container.resolve("Type");
console.log(instance.message); // prints "hello"
```

The container resolve performs the following equivalent in plain JS:
```js
var instance = factory("hello");
```

#### Method Injection

The method injector passes dependencies by calling a method of an existing object.

```js
var Type = {
  setMessage: function(message) {
    this._message = message;
  },
  getMessage: function() {
    return this._message;
  }
};

container.register("Type", Type).inject("Message").into.method("setMessage");
container.register("Message", "hello");

var type = container.resolve("Type");
console.log(type.getMessage()); // prints "hello"
```

The container resolve performs the following equivalent in plain JS:
```js
var type = Type; // Note: an instance was not created in this case
type.setMessage("hello");
```

#### Field Injection

The field injector supplies a single dependency by assigning it to a field (or property) of an existing object.

```js
var Type = {
  message: null
};

container.register("Type", Type).inject("Message").into.field("message");
container.register("Message", "hello");

var type = container.resolve("Type");
console.log(type.message); // prints "hello"
```

The container resolve performs the following equivalent in plain JS:
```js
var type = Type; // Note: an instance was not created in this case
type.message = "hello";
```

## Road Map

* Optional dependencies

## Versioning

Junkie is still in alpha development. Pre-1.0.0 versions are considered to be unstable and releases
may include breaking public API changes.

Otherwise, standard [semantic versioning](https://github.com/npm/node-semver) applies.

## Testing

```sh
$ gulp
```

## More

* [Test coverage report](http://troykinsella.github.io/junkie/coverage/lcov-report/) (master)

## License

MIT © Troy Kinsella

[npm-image]: https://badge.fury.io/js/junkie.svg
[npm-url]: https://npmjs.org/package/junkie
