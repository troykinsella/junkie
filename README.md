# junkie [![NPM version][npm-image]][npm-url] [![Build Status](https://travis-ci.org/troykinsella/junkie.svg?branch=master)](https://travis-ci.org/troykinsella/junkie)
> An extensible dependency injection container for node.js.

## Dependency Injection?

Many others have talked about the concept of [dependency injection](http://lmgtfy.com/?q=dependency+injection)
and [inversion of control](http://lmgtfy.com/?q=inversion+of+control).

Google on, nerdy brethren!

## Why Junkie?

There are a [slew](https://www.npmjs.com/search?q=dependency+injection) of other dependency injection (DI) modules 
available for node.js of varying quality and states of abandonment. Some do a lot, such as encompass the module 
loading mechanism, and others do very little, providing a fixed idea of how DI should occur.

Junkie aims to solve the problem of how to inject dependencies. No more. No less. It isn't an application framework.
It doesn't care how your modules were loaded, and it doesn't demand any Junkie awareness or specific coding styles
of your modules. And, Junkie doesn't know you! We all know what junkies want, but - it does its best to allow 
you to bolt on custom behaviours.

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

### Junkie Concepts

Junkie deals with the following concepts:

* [Containers](#containers)
* [Components](#components)
* [Injectors](#injectors)
* [Resolvers](#resolvers)

### Containers

Containers hold stuff. Duh. A Junkie container, however, holds components.

Creating a new container:
```js
var junkie = require('junkie');
var container = junkie.newContainer();

// Was that so hard? Calm down. I know. It's exciting stuff.
```

### Components

Many components are managed by a junkie container. There's nothing special about a component; it can be any data type.
A component is registered with the container by a string key, and the construction of that component can be resolved
and returned by the same key.

Here is the simplest example possible:
```js
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

Standard injectors:
* [Constructor](#constructor-injection) - Injects dependencies into a constructor.
* [Factory](#factory-injection) - Calls a factory function with dependencies.
* [Creator](#creator-injection) - Calls Object.create() and optionally injects dependencies into an initializer method.
* [Method](#method-injection) - Passes dependencies into a method.
* [Field](#field-injection) - Injects a dependency by assigning to a field.

#### Constructor Injection

The constructor injector creates a new component instance by passing dependencies into a constructor.
The registered component must be a function.

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

#### Creator Injection

The creator injector creates a component instance by calling Object.create() with a prototype object. Since a
prototype object does not supply a constructor, an initializer function can optionally be specified which 
receives injected dependencies. With the creator injector, dependencies cannot be injected without an 
initializer function, and an attempt to do so will throw a ResolutionError.

```js
var Type = {
  init: function(message) {
    this.message = message;
  }
};

container.register("Type", Type).inject("Message").into.creator("init");
container.register("Message", "hello");

var instance = container.resolve("Type");
console.log(instance.message); // prints "hello"
```

The container resolve performs the following equivalent in plain JS:
```js
var instance = Object.create(Type);
instance.init("hello");
```

#### Method Injection

The method injector passes dependencies by calling a method of an existing object or instance.

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

### Resolvers

Resolvers are junkie's mechanism for locating and/or instantiating components and component dependencies. Junkie
provides several resolvers out of the box, but a container can be configured with custom resolvers
when more behaviour is needed.

#### Caching Resolver

A caching resolver ensures that only one instance of a component is created for the lifetime 
of the encompassing container. This doesn't necessarily provide the concept of a singleton, as
other containers may contain other instances of a given component. Using a caching resolver
on a component that doesn't produce new instances when resolved is essentially a no-op, but junkie
won't stop you from that kind of madness. Junkies have their own problems.

```js
function Type() {}

container.register("Type", Type).with.constructor().with.caching();

var one = container.resolve("Type");
var two = container.resolve("Type");
console.log(one === two); // prints 'true'
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
