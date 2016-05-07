# junkie
> An extensible dependency injection container.

[![NPM version][npm-image]][npm-url] [![Bower version][bower-image]][bower-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url]

[![NPM][nodico-image]][nodico-url]

## Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
 

- [Dependency Injection?](#dependency-injection)
- [Why Junkie?](#why-junkie)
- [Overview](#overview)
  - [A Note on Examples](#a-note-on-examples)
- [TL;DR](#tldr)
- [Installation](#installation)
  - [Node.js](#nodejs)
  - [Bower](#bower)
- [Requirements](#requirements)
- [Junkie Concepts](#junkie-concepts)
- [Containers](#containers)
  - [Registering and Resolving Components](#registering-and-resolving-components)
    - [Registration Builder Syntax](#registration-builder-syntax)
    - [Component Mutability](#component-mutability)
    - [Circular Dependencies](#circular-dependencies)
  - [Child Containers](#child-containers)
  - [Container Disposal](#container-disposal)
- [Components](#components)
- [Resolvers](#resolvers)
  - [Standard Resolvers](#standard-resolvers)
    - [Assignment Resolver](#assignment-resolver)
    - [Caching Resolver](#caching-resolver)
    - [Constructor Resolver](#constructor-resolver)
    - [Creator Resolver](#creator-resolver)
    - [Decorator Resolver](#decorator-resolver)
    - [Field Resolver](#field-resolver)
    - [Factory Resolver](#factory-resolver)
    - [Factory Method Resolver](#factory-method-resolver)
    - [Freezing Resolver](#freezing-resolver)
    - [Method Resolver](#method-resolver)
    - [Sealing Resolver](#sealing-resolver)
  - [Custom Resolvers](#custom-resolvers)
    - [Synchronous Resolvers](#synchronous-resolvers)
    - [Asynchronous Resolvers](#asynchronous-resolvers)
    - [Accepting Arguments](#accepting-arguments)
- [Versioning](#versioning)
- [Testing](#testing)
- [Documentation](#documentation)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Dependency Injection?

Many others have talked about the concept of [dependency injection](http://lmgtfy.com/?q=dependency+injection)
and [inversion of control](http://lmgtfy.com/?q=inversion+of+control).

Google on, nerdy brethren!

## Why Junkie?

There are a [slew](https://www.npmjs.com/search?q=dependency+injection) of other dependency injection (DI) modules 
available for node.js and the browser of varying quality and states of development. Some do a lot, such as encompass the module 
loading mechanism, and others do very little, providing a fixed idea of how DI should occur.

Junkie aims to solve the problem of how to inject dependencies. No more. No less. It isn't an application framework.
It doesn't care how your modules were loaded, and it doesn't demand any Junkie awareness or specific coding styles
of your modules. And, Junkie doesn't know you! It does its best to allow you to bolt on custom behaviours.
Oh, and it tries to have a clean, natural, easily readable syntax so that defining your wiring is like working
with a domain-specific language.

## Overview

Behold these mouth watering features:

* Installation using NPM or Bower.
* Compatible with node.js and the browser environment.
* Supports many manners of injecting dependencies out of the box, such as by calling a constructor or a setter method.
* Several object manipulation capabilities come standard, including caching, freezing, and sealing objects.
* Provides an interface for plugging in your own "resolvers". Resolvers do stuff to things.
* Use of [`Promise`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)s for more graceful asyncronous coding.

Other goodness:

* Small downloadable library size, at ~6K minified and gzipped.
* Zero runtime dependencies (other than Promise, I guess, if you consider that a dependency).
* Build-enforced commitment to 100% test coverage with ~180 tests.
* Tests executed directly in node.js and separately using PhantomJS against Browserified code.
* Tested with node.js versions: 0.12, 4.4.3 (LTS), 5.11.0, 6.0.0

### A Note on Examples

The example code in this document is written using ES6 syntax, but ES6 is 
not required to use junkie. See [requirements](#requirements).

Also, when you see a snippet of code like this:
```
a;
// -> true
```
I am showing that the result of the expression `a` is `true`. Of course,
doing this in your real code is functionally useless.

## TL;DR

Get to the freakin' code already!

Create a new container:
```js
var c = require('junkie').newContainer();
```

Register a component for key "A":
```js
c.register("A", "thing");
```

Resolve a component for key "A":
```js
c.resolve("A").then(a => {
  a === "thing";
  // -> true
});
```

Create an instance of a component by calling the constructor:
```js
c.register("A", A).with.constructor();

c.resolve("A").then(a => {
  a instanceof A;
  // -> true
});
```

Inject another component instance into a component constructor:
```js
c.register("A", A).with.constructor("B");
c.register("B", B).with.constructor();

// Instantiate A by passing an instance of B into A's constructor
c.resolve("A").then(a => {
  a instanceof A;
  // -> true
});
```

Pass several dependencies into a component constructor:
```js
c.register("A", A).with.constructor("B", "C");
c.register("B", B);
c.register("C", C);

// A's constructor is passed B, C
c.resolve("A").then(a => {
  a instanceof A;
  // -> true
});
```

Inject another component instance into a factory function:
```js
c.register("A", AFactory).as.factory("B");
c.register("B", B).with.construtor();

// Call AFatory that creates instances of A, passing an instance of B
c.resolve("A").then(a => {
  a instanceof A;
  // -> true
});
```

Inject another component into a component's method:
```js
c.register("A", A)
  .with.constructor()
  .and.method("setB", "B");
c.register("B", B);

// Call A's constructor then call setB on the instance, passing B
c.resolve("A").then(a => {
  a instanceof A;
  // -> true
});
```

Cache the instantiation of a component, and thereafter resolve only the single instance:
```js
c.register("A", A)
 .with.constructor()
 .and.caching();

c.resolve("A").then(a1 => {
  c.resolve("A").then(a2 => {
    a1 === a2;
    // -> true
  });
});
```

Try to resolve a non-existent component:
```js
c.resolve("doesn't exist").catch(err => {
  err instanceof junkie.ResolutionError;
  // -> true
});
```

Optionally resolve a component:
```js
c.resolve("doesn't exist", { optional: true }).then(hmm => {
  hmm === null;
  // -> true
});
```

Resolve a component with an optional dependeny by specifying a "?" dependency key suffix:
```js
c.register("A", A).with.constructor("B", "C?");
c.register("B", B);

// Pass B, null into A's constructor
c.resolve("A").then(a => {
  a instanceof A;
  // -> true
});
```

## Installation

###  Node.js

```sh
$ npm install --save junkie
```

And use it:

```javascript
var junkie = require('junkie');
```

### Bower

```sh
$ bower install --save junkie
```

And use it:

```javascript
window.junkie;
// -> defined
```

## Requirements

The following areas of junkie make use of ES2015 and other newish APIs which may need to be polyfilled in the browser
environment.

* The [assignment resolver](#assignment-resolver) makes use of [`Object.assign`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign).
* The [creator resolver](#creator-resolver) makes use of [`Object.create`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create).
* The [freezing resolver](#freezing-resolver) makes use of [`Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze).
* The [sealing resolver](#sealing-resolver) makes use of [`Object.seal`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal).
* [`Promise`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) is used throughout junkie.

Possible suggested polyfills:

* [`es6-promise`](https://github.com/stefanpenner/es6-promise)
* [`es5-shim`](https://github.com/es-shims/es5-shim)
    * Particularly, for `Object.create`, `Object.freeze`, and `Object.seal`.
* [`object-assign`](https://github.com/sindresorhus/object-assign)

## Junkie Concepts

Junkie deals with the following concepts:

* [Containers](#containers)
* [Components](#components)
* [Resolvers](#resolvers)

## Containers

Containers hold stuff. Duh. A Junkie container, however, holds components.

Create a new container:
```js
var junkie = require('junkie');
var container = junkie.newContainer();

// Was that so hard? Calm down. I know. It's exciting stuff.
```

### Registering and Resolving Components

Registration requires a `String` component key, but a component can be any type. 
By registering a component with a container, it makes the component
available for resolution with the same container. The simplest resolution of a 
component is the same instance that was registered:

```js
function Component() {}

container.register("ComponentKey", Component);

container.resolve("ComponentKey").then(C => {
  C === Component;
  // -> true
});
```

A component may require different behaviours, such as creating a new component instance each time it 
is resolved. Behaviour modifications can be configured with a builder syntax where calls are chained from the 
result of the `register` call. The builder allows for associating [Resolvers](#resolvers) with a component.
This line configures a component to use a "constructor" resolver:

```js
container
  .register("Comp", Component)
  .with.constructor();
```

When a component is resolved, the associated resolvers are given the opportunity to create or modify the
instance that will be the result of the `resolve` call. Here, continuing from the above Component 
registration, while resolving, the [constructor resolver](#constructor-resolver) creates a new instance of Component:

```js
container.resolve("Comp").then(comp1 => {
  comp1 instanceof Component;
  // -> true
});

container.resolve("Comp").then(comp2 => {
  comp2 instanceof Component;
  // -> true
});

comp1 === comp2; // Pretend these are in scope
// -> false
```

#### Registration Builder Syntax

The Component's `register` method returns a new `RegistrationBuilder`. 

##### Using Resolvers

The builder has these methods that associates resolvers with the component:

* `use`
* `with`
* `as`
* `and`

They are actually all the same method, but available as aliases for the sake of more naturally readable wiring code.
The `use` method (or hereafter, any of it's aliases), accepts one of:

* A `String` which is the name of a resolver that comes standard with junkie. See the 
  [Standard Resolvers](#standard-resolvers) section for available options.
* A `Function` that defines the resolver implementation. See the [Custom Resolvers](#custom-resolvers) section
  for what a resolver looks like.

Upon completion of the call, a resolver will be associated with the component, and this building step is complete. 
A `use` call will also return the builder instance to keep chaining further builder methods.

Here, a standard resolver is associated with a component registration:

```js
// Name of a standard resolver ----v
container.register("A", A).use.constructor();
```

And here, a custom resolver is used:

```js
var whacky = require('junkie-whacky'); // Fictitious

container
  .register("A", A)
  .use(whacky);
```

#### Component Mutability

It could be considered dangerous to modify a component during a resolution of it, so junkie
tries to prevent you from doing that:

```js
var Guy = {
  coolLevel: 2
};

container
  .register("Ted", Guy);

container
  .register("Roger", Guy)
  .with.field("coolLevel", "NotSoCool");
container
  .register("NotSoCool", 1);

container.resolve("Ted").then(ted => {
  ted.coolLevel;
  // -> 2; I'm cool.
});

// Resolving Roger attempts to set the coolLevel property of Guy
container.resolve("Roger").catch(err => {
  err;
  // -> ResolutionError: Resolver requires instance to be resolved
});

// If not for the ResolutionError:
ted.coolLevel;
// -> 1; What the...
```

So, what happened here? Junkie detected that the resolution of "Roger" would have modified
the component `Guy`, and prevented it. Ted would have been sad to find
that he just isn't cool anymore.

What can we do so everyone can just get along? Well, just create new instance of `Guy` whenever
it's resolved:

```js
function Guy() {
  this.coolLevel = 2;
}

container
  .register("Ted", Guy)
  .with.constructor();

container
  .register("Roger", Guy)
  .with.constructor()
  .and.field("coolLevel", "NotSoCool");

container
  .register("NotSoCool", 1);

container.resolve("Ted").then(ted => {
  ted.coolLevel;
  // -> 2; I'm cool.
});

container.resolve("Roger").then(roger => {
  roger.coolLevel;
  // -> 1; *Sigh*, Ted is still cooler.
});
```

#### Circular Dependencies

Junkie currently does not allow circular dependencies. Attempting to resolve a circular dependency graph
will result in a thrown `ResolutionError`:

```js
container.register("A", A).with.constructor("B");
container.register("B", B).with.constructor("C");
container.register("C", C).with.constructor("A");

container.resolve("A").catch(err => {
  err;
  // -> ResolutionError
});
```

### Child Containers

In order to group and isolate your components, as well as to share and inherit behaviours, Junkie
provides child containers. A child container inherits the behaviours of its parent, and any requests
to resolve a dependency will be delegated to the parent container if not found by the child. As such,
containers can be structured into any kind of chain or tree that is needed by your application.

```js
var parent = junkie.newContainer();
parent.register("A", "I'm an A");

var child = parent.newChild();
child.register("B", "I'm a B");

child.resolve("B").then(b => {
  b;
  // -> "I'm a B"
});

child.resolve("A").then(a => {
  a;
  // -> "I'm an A"  
});
```

### Container Disposal

When you're done with a container you can tell it to release all references to registered components so
that they can happily be garbage collected. After disposing a container, calling any modifying methods
on it will throw an error. Calling `resolve` will search for the component normally, and in parent containers, but, 
of course, will not find it in the disposed container. If the container happens to be in the middle of a container
hierarchy chain, it will pass through resolution requests to its parent gracefully.

```js
container.register("Thing", "whoa man");
container.dispose();

container.resolve("Thing").catch(err => {
  err;
  // -> ResolutionError
});

container.register("AnotherThing", 2);
// -> throws Error
```

## Components

Many components are managed by a junkie container. There's nothing special about a component; it can be any data type.
A component is registered with the container by a string key, and the construction of that component can be resolved
and returned by the same key.

Here is the simplest example possible:
```js
var MyComponent = "awesome";
container.register("MyComponent", MyComponent);

container.resolve("MyComponent").then(myComponent => {
  myComponent === MyComponent;
  // -> true
});
```

## Resolvers

Resolvers are junkie's mechanism for locating and/or instantiating components and component dependencies. Junkie
provides several resolvers out of the box, but a container can be configured with custom resolvers
when more behaviour is needed.

Resolvers that come standard in Junkie can be used with a convenient builder syntax, but any resolver can be added to 
[Containers](#containers) or [Components](#components) with a middleware-style `use` call.

```js
// All component resolutions in this container will be processed by this resolver
container.use(require('./my-logging-resolver'));

// Only resolutions for this component will be processed by this resolver
container.register("Type", Type).use(require('./my-component-adaptor-resolver'))
```

Resolvers are added to the tail of the resolver chain when `use` is called on either [Containers](#containers) 
or [Components](#components). In other words, resolvers added first take precedence. This is important to remember 
in understanding order of execution when using several resolvers.

### Standard Resolvers

#### Assignment Resolver

* name - `assignment`

An assignment resolver takes dependencies and copies their properties into the resolution instance 
using `Object.assign`. As per the [Requirements](#requirements) section, using this resolver may 
require an environmentally-provided shim for `Object.assign`.

```js
function Type() {}

const MyMixinPrototype = {
  quack: function() {
     console.log("Woof");
  }
};

container
  .register("Type", Type)
  .with.constructor()
  .and.assignment("Mixin");

container
  .register("Mixin", MyMixinPrototype);

container.resolve("Type").then(t => {
  t instanceof Type;
  // -> true
  
  t.quack(); // print "Woof" (bug)
});
```

#### Caching Resolver

* name - `caching`

A caching resolver ensures that only one instance of a component is created for the lifetime 
of the encompassing container. This doesn't necessarily provide the concept of a singleton, as
other containers may contain other instances of a given component. Using a caching resolver
on a component that doesn't produce new instances when resolved is essentially a no-op, but junkie
won't stop you from that kind of madness. Junkies have their own problems.

```js
function Type() {}

container
  .register("Type", Type)
  .with.constructor()
  .and.caching();

container.resolve("Type").then(one => {
  one instanceof Type;
  // -> true

  container.resolve("Type").then(two => {
    one === two;
    // -> true
  });
});
```

#### Constructor Resolver

* name - `constructor`

The constructor resolver creates a new component instance by passing dependencies into a constructor.
The registered component must be a function.

```js
function Type(message) {
  this.message = message;
}

container
  .register("Type", Type)
  .with.constructor("Message");

container
  .register("Message", "hello");

container.resolve("Type").then(instance => {
  instance.message;
  // -> "hello"
});
```

The container resolve performs the following equivalent in plain JS:
```js
var instance = new Type("hello");
```

#### Creator Resolver

* name - `creator`

The creator resolver creates a component instance by calling `Object.create` with a prototype object. Optionally,
a `properties` argument can be supplied which will be passed as the second argument to `Object.create`.
As per the [Requirements](#requirements) section, using this resolver may 
require an environmentally-provided shim for `Object.create`.

```js
var Type = {
  foo: function() {
    return "foo";
  }
};
var props = {
  bar: {
    get: function() {
      return "bar";
    }
  }
};

container
  .register("Type", Type)
  .with.creator("props");

container
  .register("props", props);

// - alternatively -

container
  .register("Type", Type)
  .with.creator(props);

container.resolve("Type").then(instance => {
  instance === Type;
  // -> false

  instance.foo();
  // -> "foo"

  instance.bar;
  // -> "bar"
});
```

The container resolve performs the following equivalent in plain JS:
```js
var instance = Object.create(Type, props);
```

#### Decorator Resolver

* name - `decorator`

Decorator resolvers wrap the component instance being resolved in a decorator object by 
delegating to a factory to do the wrapping.

```js
var container = junkie.newContainer();

function Type() {
  this._privateField = "hi";
  this.hi = function() {
    return this._privateField;
  };
}
function HidePrivatesDecorator(instance) {
  return {
    hi: instance.hi.bind(instance)
  };
}

container
  .register("Type", Type)
  .with.constructor()
  .and.decorator("MyDecorator");

container
  .register("MyDecorator", HidePrivatesDecorator);

// - alternatively -

container
  .register("Type", Type)
  .with.constructor()
  .and.decorator(HidePrivatesDecorator);

container.resolve("Type").then(t => {
  t.hi();
  // -> "hi"

  t._privateField;
  // -> undefined

  // alas...
  t instanceof Type;
  // -> false
});
```

#### Field Resolver

* name - `field`

The field resolver supplies a single dependency by assigning it to a field (or property) of an existing
resolved instance.

```js
var Type = {
  message: null
};

container
  .register("Type", Type)
  .with.creator()
  .with.field("message", "Message");

container
  .register("Message", "hello");

container.resolve("Type").then(type => {
  type.message;
  // -> "hello"
});
```

The container resolve performs the following equivalent in plain JS:

```js
var type = Type; // Note: an instance was not created in this case
type.message = "hello";
```

#### Factory Resolver

* name - `factory`

The factory resolver obtains a component instance by calling a function with dependencies.
If the factory returns a `Promise`, junkie will gracefully chain promises
so that you never resolve an actual `Promise` instance. This allows you
to use factories that produce object asynchronously without changing
anything about how your code interacts with junkie.

```js
function factory(message) {
  return {
    message: message
  };
}

container
  .register("Type", factory)
  .with.factory("Message");

container
  .register("Message", "hello");

container.resolve("Type").then(instance => {
  instance.message;
  // -> "hello"
});
```

The container resolve performs the following equivalent in plain JS:
```js
var instance = factory("hello");
```

#### Factory Method Resolver

* name - `factoryMethod`

The factory method resolver resolves an instance by taking the result of a factory method call. The method name
is a required parameter. A factory method can return a `Promise`
to the same effect as advertised in the [factory resolver](#factory-resolver).

```js
function Sloth() {}

function SlothStore() {
  this.createSloth = function() {
    return new Sloth();
  };
}

container
  .register("Sloth", SlothStore)
  .with.constructor()
  .and.factoryMethod("createSloth");

container.resolve("Sloth").then(gary => {
  gary instanceof Sloth;
  // -> true
});
```

Dependencies can be passed into the factory method by further key arguments to `factoryMethod`.

#### Freezing Resolver

* name - `freezing`

Using the freezer resolver will make the resolved instance immutable using `Object.freeze`.
As per the [Requirements](#requirements) section, using this resolver may 
require an environmentally-provided shim for `Object.freeze`.

```js
function Type() {}

container
  .register("Type", Type)
  .with.constructor()
  .and.freezing();

container.resolve("Type").then(a => {
  a instanceof Type;
  // -> true

  Object.isFrozen(a);
  // -> true
});
```

#### Method Resolver

* name - `method`

The method resolver passes dependencies by calling a method of an existing object or instance.

```js
var Type = {
  setMessage: function(message) {
    this._message = message;
  },
  getMessage: function() {
    return this._message;
  }
};

container
  .register("Type", Type)
  .with.constructor()
  .and.method("setMessage", "Message");

container.register("Message", "hello");

container.resolve("Type").then(instance => {
  instance.getMessage();
  // -> "hello"
});
```

The container resolve performs the following equivalent in plain JS:
```js
var instance = new Type();
instance.setMessage("hello");
```

The method resolver is particularly useful in that can optionally await the resolution (or failure) of a returned 
Promise object. For example, a `start` method could be invoked on a `Server` object, and the server instance
would not be resolved until it has been started and listening on a port.

```js
function Server() {
  var listening = false;

  this.start = function() {
    return new Promise((resolve, reject) => {
      // Listen on a port...
      listening = true;
      resolve();
    });
  };

  this.isListening = function() {
    return listening;
  };
};

container.register("Server", Server)
  .with.constructor()
  .and.method("start", { await: true });

container.resolve("Server").then(server => {
  server.isListening();
  // -> true
});
```

#### Sealing Resolver

* name - `sealing`

Seals object using `Object.seal`. As per the [Requirements](#requirements) section, using this resolver may 
require an environmentally-provided shim for `Object.seal`.

```js
function Type() {
  this.dog = "Rufus";
}

container
  .register("Type", Type)
  .with.constructor()
  .and.sealing();

container.resolve("Type").then(a => {
  a instanceof Type;
  // -> true
  
  Object.isSealed(a);
  // -> true
});
```

### Custom Resolvers

A Resolver's job is to create or otherwise manipulate the result of resolving a particular component.

Resolvers are simply functions that are called in sequence. A resolver function accepts these arguments:

* `context` - A `ResolutionContext` instance which provides information about a resolve operation. It has methods 
  for obtaining the component key and registered object, among other things. 
* `resolution` - A `Resolution` instance which stores the result of the resolve operation. The resolution is 
  either a successfully created and/or populated instance, or an error.
* `next` - A `function` that must be called when the asynchronous resolver is done. You can omit this argument if the
  resolver is synchronous.

#### Synchronous Resolvers

An example synchronous Resolver that looks up instances from a secret registry:

```js
container.use(function(context, resolution) {
  var comp = MySecretComponentRegistry.lookup(context.key());
  if (comp) {
    resolution.resolve(comp);
  } else {
    resolution.fail(new Error("You don't get to know"));
    // - or -
    throw new Error("Nuh uh");
  }
});
```

#### Asynchronous Resolvers

An example asynchronous Resolver that looks up instances from a mysterious remote object service:

```js
container.use(function(context, resolution, next) {
  CrazyLand.httpHit(context.key(), function(crazyObj) {
    if (crazyEnough(crazyObj)) {
      resolution.resolve(crazyObj);
    } else {
      resolution.fail(new Error("Don't you know I'm loco?"));
    }

    // We're done here
    next();
  });
});
```

#### Accepting Arguments

When a resolver is associated with a component registration (as opposed to association with a container),
arguments can be passed in to customize how the resolver behaves. Here's a Resolver that makes objects lucky:

```js
function luckyResolver(context, resolution) {

  // Extract the argument, requiring that it be defined
  var luck = this.arg(0);

  // Apply the luck
  resolution.instance().luck = luck;
}
```

... and how it would be used:

```js
function Leprechaun() {}

container
  .register("Leppy", Leprechaun)
  .with.constructor()
  .with(luckyResolver, Infinity);

container.resolve("Leppy").then(leppy => {
  leppy instanceof Leprechaun;
  // -> true
  
  leppy.luck;
  // -> Infinity
});
```

Arguments are not currently supported on resolvers associated with containers
(i.e. when using Container#use).

## Versioning

Standard [semantic versioning][semver-url] applies.

## Testing

Runs the test suite in node and then again against the browserified distribution using phantomjs:
```sh
$ gulp test
```

Or, to run node vs. browser tests separately:
```sh
$ gulp test-node
$ gulp test-browser
```

## Documentation

* [Changelog][changelog-url] (master)
* [JSDoc API documentation][api-doc-url] (master)
* [Test coverage report][cov-report-url] (master)

## License

MIT © Troy Kinsella

<!-- URLS -->

[changelog-url]: https://github.com/troykinsella/junkie/blob/master/CHANGELOG.md
[api-doc-url]: http://troykinsella.github.io/junkie/docs/
[cov-report-url]: http://troykinsella.github.io/junkie/coverage/lcov-report/
[semver-url]: http://semver.org/
[npm-image]: https://badge.fury.io/js/junkie.svg
[npm-url]: https://npmjs.org/package/junkie
[bower-image]: https://badge.fury.io/bo/junkie.svg
[bower-url]: https://github.com/troykinsella/junkie
[travis-image]: https://travis-ci.org/troykinsella/junkie.svg?branch=master
[travis-url]: https://travis-ci.org/troykinsella/junkie
[nodico-image]: https://nodei.co/npm/junkie.png?downloads=true&downloadRank=true&stars=true
[nodico-url]: https://nodei.co/npm/junkie/
[coveralls-image]: https://coveralls.io/repos/troykinsella/junkie/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/troykinsella/junkie?branch=master
