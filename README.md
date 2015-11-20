# junkie
> An extensible dependency injection container.

[![NPM version][npm-image]][npm-url] [![Bower version][bower-image]][bower-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url]

[![NPM][nodico-image]][nodico-url]

## Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
&nbsp;

- [Dependency Injection?](#dependency-injection)
- [Why Junkie?](#why-junkie)
- [TL;DR](#tldr)
- [Installation](#installation)
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
  - [Custom Resolvers](#custom-resolvers)
- [Versioning](#versioning)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Documentation](#documentation)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Dependency Injection?

Many others have talked about the concept of [dependency injection](http://lmgtfy.com/?q=dependency+injection)
and [inversion of control](http://lmgtfy.com/?q=inversion+of+control).

Google on, nerdy brethren!

## Why Junkie?

There are a [slew](https://www.npmjs.com/search?q=dependency+injection) of other dependency injection (DI) modules 
available for node.js and the browser of varying quality and states of abandonment. Some do a lot, such as encompass the module 
loading mechanism, and others do very little, providing a fixed idea of how DI should occur.

Junkie aims to solve the problem of how to inject dependencies. No more. No less. It isn't an application framework.
It doesn't care how your modules were loaded, and it doesn't demand any Junkie awareness or specific coding styles
of your modules. And, Junkie doesn't know you! It does its best to allow you to bolt on custom behaviours.
Oh, and it tries to have a clean, natural, easily readable syntax so that defining your wiring is like working
with a domain-specific language.

## TL;DR

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
c.resolve("A");
// -> "thing"
```

Create an instance of a component by calling the constructor:
```js
c.register("A", A).with.constructor();

c.resolve("A");
// -> instanceof A === true
```

Inject another component instance into a component constructor:
```js
c.register("A", A).with.constructor("B");
c.register("B", B).with.constructor();

c.resolve("A");
// -> instanceof A === true; result of passing an instance of B into A's constructor
```

Pass several dependencies into a component constructor:
```js
c.register("A", A).with.constructor("B", "C");
c.register("B", B);
c.register("C", C);

c.resolve("A");
// -> a instanceof A === true; A's constructor was passed B, C
```

Inject another component instance into a factory function:
```js
c.register("A", AFactory).as.factory("B");
c.register("B", B).with.construtor();

c.resolve("A");
// -> instanceof A === true; result of calling AFatory with an instance of B
```

Inject another component into a component's method:
```js
c.register("A", A).with.method("setB", "B");
c.register("B", B);

c.resolve("A");
// -> instanceof A === true; result of calling A's constructor then calling setB on the instance
```

Cache the instantiation of a component, and thereafter resolve only the single instance:
```js
c.register("A", A)
 .with.constructor()
 .and.caching();

c.resolve("A");
// -> instanceof A === true
c.resolve("A") === c.resolve("A");
// -> true
```

Try to resolve a non-existent component:
```js
c.resolve("doesn't exist");
// -> throws ResolutionError
```

Optionally resolve a component:
```js
c.resolve("doesn't exist", { optional: true });
// -> null
```

Resolve a component with an optional dependeny by specifying a "?" dependency key suffix:
```js
c.register("A", A).with.constructor("B", "doesn't exist?");
c.register("B", B);

c.resolve("A") instanceof A;
// -> true; A's constructor was passed B, null
```

## Installation

Node.js:
```sh
$ npm install --save junkie
```

Bower:
```sh
$ bower install --save junkie
```

## Requirements

The following areas of junkie make use of newish notable calls which may need to be polyfilled in the browser
environment. By avoiding the use of the feature, you avert the need for a polyfill.

* The [assignment resolver](#assignment-resolver) makes use of the `Object.assign` call.
* The [freezing resolver](#freezing-resolver) uses the `Object.freeze` call.

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

var C = container.resolve("ComponentKey");

C === Component;
// -> true
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
var comp1 = container.resolve("Comp");
comp1 instanceof Component;
// -> true

var comp2 = container.resolve("Comp");
comp2 instanceof Component;
// -> true

comp1 === comp2;
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

var ted = container.resolve("Ted");
ted.coolLevel;
// -> 2; I'm cool.

var roger = container.resolve("Roger");
// -> throws ResolutionError: Resolver requires instance to be resolved

// If not for the thrown ResolutionError:
ted.coolLevel;
// -> 1; What the...
```

So, what happened here? Junkie detected that the resolution of "Roger" would have modified
the component `Guy`, and prevented it. Ted would have been pissed.

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

var ted = container.resolve("Ted");
ted.coolLevel;
// -> 2; I'm cool.

var roger = container.resolve("Roger");
roger.coolLevel;
// -> 1; *Sigh*, Ted is cooler.

ted.coolLevel;
// -> 2; Yep. It's my shoes that does it.
```

#### Circular Dependencies

Junkie currently does not allow circular dependencies. Attempting to resolve a circular dependency graph
will result in a thrown `ResolutionError`:

```js
container.register("A", A).with.constructor("B");
container.register("B", B).with.constructor("C");
container.register("C", C).with.constructor("A");

container.resolve("A");
// -> throws ResolutionError
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

child.resolve("B");
// -> "I'm a B"

child.resolve("A");
// -> "I'm an A"
```

### Container Disposal

When you're done with a container you can tell it to release all references to registered components so
that they can happily be garbage collected. After disposing of a container, calling any modifying methods
on it will throw an error. Calling `resolve` will search for the component normally, and in parent containers, but, 
of course, not finding it in the disposed container. If the container happens to be in the middle of a container
hierarchy chain, it will pass through resolution requests to its parent gracefully.

```js
container.register("Thing", "whoa man");
container.dispose();

container.resolve("Thing");
// -> throws ResolutionError

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

var myComponent = container.resolve("MyComponent");
myComponent === MyComponent;
// -> true
```

## Resolvers

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

Resolvers are added to the tail of the resolver chain when `use` is called on either [Containers](#containers) 
or [Components](#components). In other words, resolvers added first take precidence. This is important to remember 
in understanding order of execution when using several resolvers.

### Standard Resolvers

#### Assignment Resolver

* name - `assignment`

An assignment resolver takes dependencies and copies their properties into the resolution instance 
using `Object.assign`. Note: As per the [Requirements](#requirements) section, using this resolver may 
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

var t = container.resolve("Type");

t instanceof Type;
// -> true

t.quack(); // print "Woof" (bug)
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

var one = container.resolve("Type");
var two = container.resolve("Type");

one instanceof Type;
// -> true
one === two;
// -> true
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

var instance = container.resolve("Type");

instance.message;
// -> "hello"
```

The container resolve performs the following equivalent in plain JS:
```js
var instance = new Type("hello");
```

#### Creator Resolver

* name - `creator`

The creator resolver creates a component instance by calling `Object.create` with a prototype object. Since a
prototype object does not supply a constructor, an initializer function can optionally be specified which 
receives injected dependencies.

```js
var Type = {
  init: function(message) {
    this.message = message;
  }
};

container
  .register("Type", Type)
  .with.creator("init" /* initializer method */, 
                "Message" /* dependency arguments... */);

container.register("Message", "hello");

var instance = container.resolve("Type");
instance.message;
// -> "hello"
```

The container resolve performs the following equivalent in plain JS:
```js
var instance = Object.create(Type);
instance.init("hello");
```

#### Decorator Resolver

* name - `decorator`

Decorator resolvers wrap the component instance being resolved in another decorator object by 
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

var t = container.resolve("Type");
t.hi();
// -> "hi"

t._privateField;
// -> undefined

// alas
t instanceof Type;
// -> false
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

var type = container.resolve("Type");

type.message;
// -> "hello"
```

The container resolve performs the following equivalent in plain JS:

```js
var type = Type; // Note: an instance was not created in this case
type.message = "hello";
```

#### Factory Resolver

* name - `factory`

The factory resolver obtains a component instance by calling a function with dependencies.

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

var instance = container.resolve("Type");

instance.message;
// -> "hello"
```

The container resolve performs the following equivalent in plain JS:
```js
var instance = factory("hello");
```

#### Factory Method Resolver

* name - `factoryMethod`

The factory method resolver resolves an instance by taking the result of a factory method call. The method name
is a required parameter.

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

var gary = container.resolve("Sloth");

gary instanceof Sloth;
// -> true
```

Dependencies can be passed into the factory method by further key arguments to `factoryMethod`.

#### Freezing Resolver

* name - `freezing`

Using the freezer resolver will make the resolved instance immutable using `Object.freeze`.

```js
function Type() {}

container
  .register("Type", Type)
  .with.constructor()
  .and.freezing();

var a = container.resolve("Type");

a instanceof Type;
// -> true

a.newProperty = 123;
// -> throws Error in strict mode, otherwise silently ignores

a.newProperty;
// -> undefined
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
  .with.method("setMessage", "Message");

container.register("Message", "hello");

var type = container.resolve("Type");

type.getMessage();
// -> "hello"
```

The container resolve performs the following equivalent in plain JS:
```js
var type = Type; // Note: an instance was not created in this case
type.setMessage("hello");
```

### Custom Resolvers

Resolvers are simply functions that are called in sequence. Each resolver function is passed a `next` function
which is called to pass control to the next resolver in the chain. This design allows each resolver the opportunity
to take control both before and after the chain completes processing (in other words, when `next()` reached 
the end of the chain). The `next` function must be called by a resolver in every success case.

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
    // - or -
    throw new Error("Nuh uh");
  }

  next();
});
```

## Versioning

Junkie is still in alpha development. Pre-1.0.0 versions are considered to be unstable and releases
may include breaking public API changes.

Otherwise, standard [semantic versioning][semver-url] applies.

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

## Roadmap

* Optional asynchronous resolution with promises

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
[semver-url]: https://github.com/npm/node-semver
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
