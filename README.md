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
of your modules. And, Junkie doesn't know you! It does its best to allow you to bolt on custom behaviours.
Oh, and it tries to have a clean, natural, easily readable syntax so that defining your wiring is like working
with a domain-specific language.

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

Create a new container:
```js
var junkie = require('junkie');
var container = junkie.newContainer();

// Was that so hard? Calm down. I know. It's exciting stuff.
```

#### Child Containers

In order to group and isolate your components, as well as to share and inherit behaviours, Junkie
provides child containers. A child container inherits the behaviours of its parent, and any requests
to resolve a dependency will be delegated to the parent container if not found by the child. As such,
containers can be structured into any kind of chain or tree that is needed by your application.

```js
var parent = junkie.newContainer();
parent.register("A", "I'm an A");

var child = parent.newChild();
child.register("B", "I'm a B");

child.resolve("B"); // -> "I'm a B"
child.resolve("A"); // -> "I'm an A"
```

#### Container Disposal

When you're done with a container you can tell it to release all references to registered components so
that they can happily be garbage collected. After disposing of a container, calling any modifying methods
on it will throw an error. Calling resolve will search for the component normally, and in parent containers, but, 
of course, not finding it in the disposed container. If the container happens to be in the middle of a container
hierarchy chain, it will pass through resolution requests to its parent gracefully.

```js
container.register("Thing", "whoa man");
container.dispose();

container.resolve("Thing"); // throws ResolutionError
container.register("AnotherThing", 2); // throws Error
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

Resolvers that come standard in Junkie can be used with a convenient builder syntax, but any resolver can be added to 
[Containers](#containers) or [Components](#components) with a middleware-style `use` call, made popular by projects 
like connect and express.

```js
// All component resolutions in this container will be processed by this resolver
container.use(require('./my-logging-resolver'));

// Only resolutions for this component will be processed by this resolver
container.register("Type", Type).use(require('./my-component-adaptor-resolver'))
```

Resolvers are added to the head of the resolver chain when `use` is called on either [Containers](#containers) 
or [Components](#components). In other words, resolvers added last take precidence. This is important to remember 
in understanding order of execution when using several resolvers.

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

### Defining Behaviours

Junkie exposes extension points in the form of [Resolvers](#resolvers) and [Injectors](#injectors).

#### Custom Resolvers

Resolvers are simply functions that are called in sequence. Each resolver function is passed a `next` function
which is called to pass control to the next resolver in the chain. This design allows each resolver the opportunity
to take control both before and after the chain completes processing (in other words, when `next()` reached 
the end of the chain). The `next` function must be called in every case.

A resolver function also receives a `context` argument which is an instance of `ResolutionContext`. This is used
to obtain information about the current component being resolved. It provides methods for obtaining the component
key and registered object, among other things.

The passed `resolution` argument, which is an instance of `Resolution` gives control over the result of the resolution
operation. The resolution is either a successfully resolved instance, or an error.

```js
container.use(function(context, resolution, next) {
  var comp = MySecretComponentRegistry.lookup(context.key());
  if (comp) {
    resolution.resolve(comp);
  } else {
    resolution.fail(new Error("You don't get to know"));
  }

  next();
});
```

#### Custom Injectors

Coming soon.

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

* [JSDoc API documentation](http://troykinsella.github.io/junkie/docs/) (master)
* [Test coverage report](http://troykinsella.github.io/junkie/coverage/lcov-report/) (master)

## License

MIT © Troy Kinsella

[npm-image]: https://badge.fury.io/js/junkie.svg
[npm-url]: https://npmjs.org/package/junkie
