/**
 * junkie - An extensible dependency injection container library
 * @version v0.1.1
 * @link https://github.com/troykinsella/junkie
 * @license MIT
 */
!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.junkie=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var Resolver = _dereq_('./Resolver');
var Resolution = _dereq_('./Resolution');
var ResolutionContext = _dereq_('./ResolutionContext');
var ResolutionError = _dereq_('./ResolutionError');

/**
 * Captures a component registration with a {@link Container}.
 * Instances are created during {@link Container#register} calls.
 *
 * @param key {String}
 * @param instance {*}
 * @param container {Container}
 * @param containerResolvers {Array.<Resolver>|undefined}
 * @constructor
 * @classdesc Private to junkie internals.
 */
function Component(key, instance, container, containerResolvers) {
  this._key = key;
  this._instance = instance;
  this._container = container;
  this._containerResolvers = containerResolvers || [];
  this._resolvers = [];
  this._store = {};
}

/** @lends Component# */
var C = Component.prototype;

/**
 * Obtain the component key.
 * @return {String}
 */
C.key = function() {
  return this._key;
};

/**
 * Obtain the user-provided component instance.
 * @return {*}
 */
C.instance = function() {
  return this._instance;
};

/**
 * Obtain the data store for this component.
 * @return {Object}
 */
C.store = function() {
  return this._store;
};

/**
 * Use the given resolver middleware.
 * @param resolver {String|Function} The resolver to use. Supplying a String attempts to locate a standard resolver
 *        by name. Supplying a Function uses the Function itself as the resolver implementation.
 * @see Resolver
 * @return {Component} <code>this</code>.
 */
C.use = function(resolver, args) {
  resolver = Resolver.normalize(resolver, args);
  this._resolvers.push(resolver);
  return this;
};


C._createContext = function(options) {
  var ctx = new ResolutionContext({
    previous: options.resolutionContext,
    container: this._container,
    key: this.key(),
    component: this.instance(),
    store: this.store()
  });

  this._checkCircularDeps(ctx);
  return ctx;
};

C._checkCircularDeps = function(ctx) {
  // Check for circular dependencies
  var seenKeys = {};

  do {
    var key = ctx.key();
    if (seenKeys[key]) {
      throw new ResolutionError("Circular dependency: " + key);
    }
    seenKeys[key] = true;
    ctx = ctx.previous();
  } while (ctx);
};

/**
 * Resolve an instance for this component.
 * @param options {Object} The optional resolution options.
 * @return {*|null}
 */
C.resolve = function(options) {
  options = options || {};

  var res = new Resolution();
  var ctx = this._createContext(options);

  var i = 0;
  var resolvers = this._containerResolvers.concat(this._resolvers);

  var next = function() {
    var r = resolvers[i++];
    if (!r || res.error() || res.isDone()) {
      return;
    }

    r.resolve(ctx, res, next);
  }.bind(this);

  next();
  if (!res.instance()) {
    res.resolve(this.instance());
  }

  return res;
};

module.exports = Component;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Component.js","/")
},{"./Resolution":5,"./ResolutionContext":6,"./ResolutionError":7,"./Resolver":8,"1YiZ5S":21}],2:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var assert = _dereq_('./util').assert;
var Component = _dereq_('./Component');
var RegistrationBuilder = _dereq_('./RegistrationBuilder');
var ResolutionError = _dereq_('./ResolutionError');
var Resolver = _dereq_('./Resolver');

var nullContainer = {
  resolve: function(key, options) {
    if (options && options.optional) {
      return null;
    }
    throw new ResolutionError("Not found: " + key);
  }
};

/**
 * <strong>Private constructor</strong>. Instances are normally created with these methods:
 * <ul>
 *   <li>{@link junkie.newContainer}</li>
 *   <li>{@link Container#newChild}</li>
 * </ul>
 *
 * @param parent {Container|undefined} The optional parent container.
 * @param resolvers {Array.<Resolver>|undefined} The optional list of resolvers.
 *
 * @constructor
 */
function Container(parent, resolvers) {
  this._parent = parent || nullContainer;
  this._registry = {};
  this._containerResolvers = resolvers ? resolvers.slice() : [];
}

/** @lends Container# */
var C = Container.prototype;

/**
 * Obtain the parent container, or <code>null</code> if this container is an orphan.
 * @return {Container|null} The parent container or <code>null</code>
 */
C.parent = function() {
  return this._parent === nullContainer ? null : this._parent;
};

/**
 * Create a new child Container.
 *
 * @param options {object} Optional configuration options
 * @param options.inherit {boolean} When <code>true</code>, the new child container inherits this container's
 *        resolvers. Defaults to <code>true</code>.
 */
C.newChild = function(options) {
  this._checkDisposed();

  options = options || {};

  var resolvers = this._containerResolvers;
  if (options.inherit === false) {
    resolvers = null;
  }

  var child = new Container(this, resolvers);

  return child;
};

/**
 * Use the given resolver middleware.
 * @param resolver {String|Function} The resolver to use. Supplying a String attempts to locate a standard resolver
 *        by name. Supplying a Function uses the Function itself as the resolver implementation.
 * @return {Container} <code>this</code>.
 * @see Resolver
 */
C.use = function(resolver) {
  this._checkDisposed();

  resolver = Resolver.normalize(resolver);
  this._containerResolvers.push(resolver);
  return this;
};

/**
 * Dispose of this container, releasing all references to components. Using any modifying method after this
 * call will throw an Error. Resolve requests will be delegated to the parent container, if available.
 */
C.dispose = function() {
  delete this._registry; // Drop references to all components
};

C._checkDisposed = function() {
  if (!this._registry) {
    throw new Error("Container disposed");
  }
};

/**
 * Register the given component with this Container, making it available for resolution and as a
 * potential dependency of another component.
 *
 * @param key {String} The key associated with the component.
 * @param component {*} The component instance that will be tracked by this container.
 * @return {RegistrationBuilder} A registration builder to configure the registration.
 *
 * @throws Error if key is not a string
 * @throws Error if component is not defined or <code>null</code>.
 */
C.register = function(key, component) {
  this._checkDisposed();

  assert(typeof key === 'string', "key must be a string");
  assert(!!component, "component must be defined");

  var comp = this._createComponent(key, component);
  this._registry[key] = comp;

  return new RegistrationBuilder(comp);
};

C._createComponent = function(key, component) {
  var comp = new Component(key, component, this, this._containerResolvers);
  return comp;
};

C._get = function(key) {
  assert(typeof key === 'string', "key must be a string");
  if (!this._registry) {
    // If the container was disposed, behave like a 'not found' so we continue searching the parent
    return null;
  }
  return this._registry[key];
};

/**
 * Resolve an instance for the given component key. To resolve an instance, every associated resolver is passed
 * control and given the opportunity to create and configure the resulting component instance.
 * <p>
 * When resolving dependencies of the requested component, this same method is invoked internally.
 *
 * @param key {String} The component key with which to obtain an instance.
 * @param options {Object|undefined} Optional configuration options
 * @param options.optional {boolean} When <code>true</code>, in the event that the component cannot be resolved
 *        return <code>null</code> instead of throwing a ResolutionError.
 * @return {*|null} The resulting component instance.
 *
 * @throws Error if key is not a string
 * @throws ResolutionError when the mandatory key cannot be located, or a failure occurs during the resolution process.
 * @throws Error if any resolver completes asynchronously
 */
C.resolve = function(key, options) {
  options = options || {};

  // Lookup the component
  var comp = this._get(key);

  // If the component is not found, delegate to the parent container
  if (!comp) {
    return this._parent.resolve(key, options);
  }

  // Resolve the component instance
  var resolution = comp.resolve(options);

  // If any resolver failed, bail now
  var err = resolution.error();
  if (err) {
    throw  err;
  }

  var instance = resolution.instance();

  return instance;
};

module.exports = Container;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Container.js","/")
},{"./Component":1,"./RegistrationBuilder":4,"./ResolutionError":7,"./Resolver":8,"./util":20,"1YiZ5S":21}],3:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var assert = _dereq_('./util').assert;

/**
 * Instances are created internally during component registration.
 *
 * @param key {String} The component key.
 * @param optional {boolean} <code>true</code> when the dependency is optional.
 * @constructor
 * @classdesc Private to junkie internals.
 */
function Dependency(key, optional) {
  assert(key, "key must be defined");

  this._key = key;
  this._optional = optional;
}

/** @lends Dependency# */
var D = Dependency.prototype;

/**
 * The key of the dependent component.
 * @return {String} The dependency key.
 */
D.key = function() {
  return this._key;
};

/**
 * Determine if the dependency is optional.
 * @return {boolean} <code>true</code> for an optional dependency.
 */
D.optional = function() {
  return this._optional;
};

/**
 *
 * @param key {String|Dependency}
 * @return {Dependency}
 */
Dependency.getOrCreate = function(keyOrDep, options) {
  if (keyOrDep instanceof Dependency) {
    return keyOrDep;
  }

  var optional = false;

  if (options && typeof options.optional === 'boolean') {
    optional = options.optional;
  }

  // Parse optional from key suffix
  var key = keyOrDep;
  if (key[key.length - 1] === '?') {
    key = key.substring(0, key.length - 1);
    optional = true;
  }

  return new Dependency(key, optional);
};

module.exports = Dependency;


}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Dependency.js","/")
},{"./util":20,"1YiZ5S":21}],4:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var Resolver = _dereq_('./Resolver');

/**
 * <strong>Private constructor</strong>. Instances are normally created internally and returned from calls to
 * {@link Container#register}.
 *
 * @param comp {*}
 * @constructor
 */
function RegistrationBuilder(comp) {
  this._comp = comp;

  this._initInterface();
}

var RB = RegistrationBuilder.prototype;

RB._initInterface = function() {
  var useGetter = this._createUseGetter();

  [ 'use', 'with', 'as', 'and' ]
    .forEach(function(alias) {
      Object.defineProperty(this, alias, {
        get: useGetter
      });
    }.bind(this));
};

RB._use = function(resolver) {
  var args = Array.prototype.slice.apply(arguments);
  args.shift(); // remove resolver

  this._comp.use(resolver, args);
  return this;
};

RB._createUseGetter = function() {
  var use = this._use.bind(this); // Copy
  var resolverNames = Object.keys(Resolver.StandardResolvers);

  resolverNames.forEach(function(resolver) {
    use[resolver] = use.bind(this, resolver);
  }.bind(this));

  return function() { // Getter function
    return use; // Getter result
  };
};


module.exports = RegistrationBuilder;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/RegistrationBuilder.js","/")
},{"./Resolver":8,"1YiZ5S":21}],5:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var ResolutionError = _dereq_('./ResolutionError');

/**
 * <strong>Private constructor</strong>. Instances are normally created internally and passed to resolvers.
 * @param component
 * @constructor
 */
function Resolution() {
  this._instance = null;
  this._error = null;
  this._done = false;
}

/** @lends Resolution# */
var R = Resolution.prototype;

/**
 * Resolve the given instance of a component. This will be come the result of the {@link Container#resolve} call that
 * triggered this resolution.
 * @param instance {*} The instance to resolve, or <code>null</code> or <code>undefined</code> to cancel a
 *        previously resolved instance.
 */
R.resolve = function(instance) {
  this._instance = instance;
};

/**
 * Fail this resolution with the given error.
 * @param error {Error} The error representing the cause of the resolution failure.
 */
R.fail = function(error) {
  this._error = error;
};

/**
 * Mark this resolution as done regardless of the current resolved or failed state. "Done" means that, even though
 * a resolver will call the <code>next()</code> callback, the process will be aborted and no further resolvers will
 * be invoked.
 */
R.done = function() {
  this._done = true;
};

/**
 * Get the instance that will be the result of the component resolution. This instance is set by
 * the {@link #resolve} method.
 * @param require {boolean|undefined} <code>true</code> if the instance must be defined, <code>false</code> if the
 *        instance must not be defined, or omit the parameter if no defined checks should occur.
 * @return {*|null}
 * @throws ResolutionError when <code>require</code> is <code>true</code> and the instance is <code>null</code>
 *                         or <code>require</code> is <code>false</code> and the instance is not <code>null</code>.
 */
R.instance = function(_dereq_) {
  var i = this._instance;

  if (_dereq_ !== undefined) {
    if (_dereq_ && i === null) {
      throw new ResolutionError("Resolver requires instance to be resolved");
    } else if (!_dereq_ && i !== null) {
      throw new ResolutionError("Resolver requires instance to be resolved");
    }
  }

  return i;
};

/**
 * Get the error that failed the resolution. This error was set by the {@link #fail} method.
 * @return {Error|null} The resolution failure error, or <code>null</code> if not failed.
 */
R.error = function() {
  return this._error;
};

/**
 * Determine if this resolution is done; that further resolvers will not be invoked.
 * @return {boolean} The done state of this component resolution.
 */
R.isDone = function() {
  return this._done;
};

R.toString = function() {
  return "Resolution{" +
    "instance: " + this._instance +
    ", error: " + this._error +
    ", done: " + this._done +
    "}";
};

module.exports = Resolution;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Resolution.js","/")
},{"./ResolutionError":7,"1YiZ5S":21}],6:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var Dependency = _dereq_('./Dependency');

/**
 * <strong>Private constructor</strong>. Instances are normally created internally and passed to resolvers.
 * @param options
 * @constructor
 */
function ResolutionContext(options) {
  this._previous = options.previous;
  this._container = options.container;
  this._key = options.key;
  this._component = options.component;
  this._store = options.store;
}

/** @lends ResolutionContext# */
var RC = ResolutionContext.prototype;

/**
 * Obtain the previous context in the resolution chain.
 * @return {ResolutionContext|null}
 */
RC.previous = function() {
  return this._previous;
};

RC.keyStack = function() {
  var stack = [];
  var ctx = this;
  do {
    stack.unshift(ctx.key());
    ctx = ctx.previous();
  } while (ctx);
  return stack;
};

/**
 * Get the key of the component being resolved.
 * @return {String} The component key.
 */
RC.key = function() {
  return this._key;
};

/**
 * Get the component being resolved. This is the same instance
 * that was passed into the {@link Container#register} method.
 * @return {*}
 */
RC.component = function() {
  return this._component;
};

/**
 * Provides access to arbitrary data that is stored at the scope of the component registration.
 * This allows a resolver to preserve state across several resolutions of a single component.
 *
 * @param key {String} The optional data key.
 * @param value {*} The optional data value.
 *
 * @example
 * // Set a value
 * ctx.store('dogCount', 3);
 *
 * // Get a value
 * ctx.store('dogCount'); // -> 3
 *
 * // Get all values
 * ctx.store(); // -> { 'dogCount': 3 }
 */
RC.store = function(key, value) {
  if (key === undefined) {
    return this._store;
  } else if (value === undefined) {
    return this._store[key];
  } else {
    this._store[key] = value;
  }
};

/**
 * Resolve the given Dependency instance or instances using the same container in which
 * the component for this resolution lives.
 *
 * @param deps {String|Array.<String>|Dependency|Array.<Dependency>} A Dependency instance or Array of instances.
 * @param options {Object|undefined} Optional configuration options.
 *
 * @return {{map: {}, list: Array}} A structure containing resolved dependencies. The 'map' property
 */
RC.resolve = function(deps, options) {
  var single = !Array.isArray(deps);
  if (single) {
    deps = [ deps ];
  }

  var resolvedDeps = {
    map: {},
    list: []
  };

  deps
    .map(function(dep) {
      return Dependency.getOrCreate(dep, options);
    })
    .forEach(function(dep) {
      var resolvedDep = this._container.resolve(dep.key(), {
        optional: dep.optional(),
        resolutionContext: this
      });
      resolvedDeps.map[dep.key()] = resolvedDep;
      resolvedDeps.list.push(resolvedDep);
    }.bind(this));

  if (single) {
    return resolvedDeps.list[0];
  }
  return resolvedDeps;
};

RC.toString = function() {
  return "ResolutionContext{" +
    ", keyStack: " + this.keyStack() +
    ", storeKeys: " + Object.keys(this.store()) +
    "}";
};

module.exports = ResolutionContext;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/ResolutionContext.js","/")
},{"./Dependency":3,"1YiZ5S":21}],7:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var inherits = _dereq_('./util').inherits;

/**
 * An Error that is thrown from a {@link Container#resolve} call upon a failure.
 *
 * @param message
 * @constructor
 */
function ResolutionError(message) {
  Error.call(this);
  this.message = message;
}
ResolutionError.prototype.type = 'ResolutionError';
ResolutionError.prototype.constructor = ResolutionError;
inherits(ResolutionError, Error);

module.exports = ResolutionError;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/ResolutionError.js","/")
},{"./util":20,"1YiZ5S":21}],8:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var assert = _dereq_('./util').assert;
var ResolutionError = _dereq_('./ResolutionError');

/**
 * Instances are created internally during calls to {@link Container#use} and {@link RegistrationBuilder#use}.
 *
 * @param impl {Function} The resolver implementation.
 * @param args {Array} The arguments to make available to the resolver implementation.
 * @constructor
 * @classdesc Private to junkie internals.
 */
function Resolver(impl, args) {
  assert(typeof impl === 'function', "Resolver must be a function: " + impl);
  this._impl = impl;
  this._args = args || [];
}

/** @lends Resolver# */
var R = Resolver.prototype;

R.resolve = function(ctx, res, next) {
  var resolverThis = this._createResolverThis();
  try {
    this._impl.call(resolverThis, ctx, res, next);
  } catch (e) {
    res.fail(e);
    return next();
  }
};

R._createResolverThis = function() {
  return {
    arg: this.arg.bind(this),
    args: this.args.bind(this)
  };
};

R.arg = function(i, failMessage) {
  var val = this._args[i];
  if (!val) {
    throw new ResolutionError(failMessage ||
      ("Resolver " + this._impl.name + " requires argument at index: " + i));
  }
  return val;
};

R.args = function() {
  return this._args.slice();
};

// Dynamic requires would be nice, but browserify shits the bed
Resolver.StandardResolvers = Object.freeze({
  assignment: _dereq_('./resolver/assignment'),
  caching: _dereq_('./resolver/caching'),
  constructor: _dereq_('./resolver/constructor'),
  creator: _dereq_('./resolver/creator'),
  decorator: _dereq_('./resolver/decorator'),
  factory: _dereq_('./resolver/factory'),
  field: _dereq_('./resolver/field'),
  freezing: _dereq_('./resolver/freezing'),
  logging: _dereq_('./resolver/logging'),
  method: _dereq_('./resolver/method')
});

Resolver.normalize = function(resolver, args) {
  assert(!!resolver, "resolver must be defined");
  if (typeof resolver === 'string') {
    resolver = Resolver.StandardResolvers[resolver];
  }

  assert(typeof resolver === 'object' ||
    typeof resolver === 'function', "resolver must be a function or object");

  if (!(resolver instanceof Resolver)) {
    resolver = new Resolver(resolver, args);
  }

  return resolver;
};

module.exports = Resolver;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Resolver.js","/")
},{"./ResolutionError":7,"./resolver/assignment":10,"./resolver/caching":11,"./resolver/constructor":12,"./resolver/creator":13,"./resolver/decorator":14,"./resolver/factory":15,"./resolver/field":16,"./resolver/freezing":17,"./resolver/logging":18,"./resolver/method":19,"./util":20,"1YiZ5S":21}],9:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var Container = _dereq_('./Container');
var ResolutionError = _dereq_('./ResolutionError');

/**
 * The main entry point into doing anything with junkie.
 *
 * @namespace
 */
var junkie = {};

/**
 * Create a new Container
 * @return Container
 */
junkie.newContainer = function() {
  return new Container();
};

// Expose public types

/**
 *
 * @type {ResolutionError}
 */
junkie.ResolutionError = ResolutionError;

module.exports = junkie;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_3b5cab47.js","/")
},{"./Container":2,"./ResolutionError":7,"1YiZ5S":21}],10:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

/**
 * An assignment resolver takes dependencies and copies their
 * into the resolution instance using <code>Object.assign</code>.
 *
 * @function
 * @exports Resolver:assignment
 */
module.exports = function assignment(ctx, res, next) {
  next();

  var instance = res.instance(true);

  var deps = ctx.resolve(this.args());
  deps.list.forEach(function(dep) {
    Object.assign(instance, dep);
  });

  res.resolve(instance);
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/assignment.js","/resolver")
},{"1YiZ5S":21}],11:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var cacheKey = 'caching_instance';

/**
 * Searches the {@link Component#store} for a cached instance of a previously resolved component. If one
 * is found, it is resolved and the resolution is marked as done. Otherwise, the next resolvers are called,
 * and when they complete, the resulting resolved instance is cached such that subsequent resolves will
 * return this instance.
 *
 * @function
 * @exports Resolver:caching
 */
module.exports = function caching(ctx, res, next) {
  var cached = ctx.store(cacheKey);
  if (cached) {
    res.resolve(cached);
    res.done();
  }

  next();

  ctx.store(cacheKey, res.instance(true));
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/caching.js","/resolver")
},{"1YiZ5S":21}],12:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var ResolutionError = _dereq_('../ResolutionError');

/**
 * Creates a new component instance using a constructor.
 *
 * @function
 * @exports Resolver:constructor
 */
module.exports = function constuctor(ctx, res, next) {
  res.instance(false);

  var Type = ctx.component();
  if (typeof Type !== 'function') {
    throw new ResolutionError("Constructor resolver: Component must be a function: " + (typeof Type));
  }

  var deps = ctx.resolve(this.args());
  var instance = Object.create(Type.prototype);
  Type.apply(instance, deps.list);
  res.resolve(instance);

  next();
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/constructor.js","/resolver")
},{"../ResolutionError":7,"1YiZ5S":21}],13:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var ResolutionError = _dereq_('../ResolutionError');

/**
 * Creates a new component instance using a <code>Object.create</code>.
 *
 * @function
 * @exports Resolver:creator
 */
module.exports = function creator(ctx, res, next) {
  res.instance(false);

  var deps = this.args();
  var targetInitializer = deps.shift();

  var instance = Object.create(ctx.component());

  if (targetInitializer) {
    deps = ctx.resolve(deps);

    var initializer = instance[targetInitializer];
    if (typeof initializer !== 'function') {
      throw new ResolutionError("Creator resolver: Initializer function not found: " + targetInitializer);
    }
    initializer.apply(instance, deps.list);

  } else {
    if (deps.length > 1) {
      throw new ResolutionError("Creator resolver: Initializer function not specified, but dependencies supplied");
    }
  }

  res.resolve(instance);

  next();
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/creator.js","/resolver")
},{"../ResolutionError":7,"1YiZ5S":21}],14:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var ResolutionError = _dereq_('../ResolutionError');

function resolveDecoratorArg(resolver, ctx) {
  var decorator = resolver.arg(0,
    "decorator resolver requires argument of string dependency key or factory function");

  if (typeof decorator === 'string') {
    decorator = ctx.resolve(decorator);
  }
  if (typeof decorator !== 'function') {
    throw new ResolutionError("decorator must be a factory function");
  }

  return decorator;
}

/**
 * Wraps the previously resolved instance or the component with a decorator by calling a decorator factory function.
 *
 * A decorator resolver requires a second argument to the {@link Container#use} or {@link RegistrationBuilder#use}
 * call with which it is being used. This argument specifies the decorator factory and is either:
 * <ul>
 *   <li>A <code>String</code> key of the decorator factory to resolve</li>
 *   <li>A <code>Function</code> that is the decorator factory</li>
 * </ul>
 *
 * @function
 * @exports Resolver:decorator
 */
module.exports = function decorator(ctx, res, next) {
  var decoratorFactory = resolveDecoratorArg(this, ctx);

  next();

  var decorated = decoratorFactory(res.instance() || ctx.component());
  if (decorated === undefined || decorated === null) {
    throw new ResolutionError('decorator factory did not return instance when resolving: ' + ctx.key());
  }

  res.resolve(decorated);
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/decorator.js","/resolver")
},{"../ResolutionError":7,"1YiZ5S":21}],15:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var ResolutionError = _dereq_('../ResolutionError');

/**
 * Creates a new component instance by calling a factory function.
 *
 * @function
 * @exports Resolver:factory
 */
module.exports = function factory(ctx, res, next) {
  var factoryFn = res.instance() || ctx.component();
  if (typeof factoryFn !== 'function') {
    throw new ResolutionError("Factory resolver: Component must be a function: " + (typeof factoryFn));
  }

  var deps = ctx.resolve(this.args());
  var instance = factoryFn.apply(factory, deps.list);
  res.resolve(instance);

  next();
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/factory.js","/resolver")
},{"../ResolutionError":7,"1YiZ5S":21}],16:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var ResolutionError = _dereq_('../ResolutionError');

/**
 * Injects a dependency by assigning to a field of the component instance.
 *
 * @function
 * @exports Resolver:field
 */
module.exports = function field(ctx, res, next) {

  next();

  var instance = res.instance(true);

  var targetField = this.arg(0, "Field resolver: must supply target field name");

  var deps = this.args();
  deps.shift(); // Remove targetField
  if (deps.length !== 1) {
    throw new ResolutionError("Field resolver: Must supply exactly one dependency");
  }

  deps = ctx.resolve(deps);

  instance[targetField] = deps.list[0];
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/field.js","/resolver")
},{"../ResolutionError":7,"1YiZ5S":21}],17:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var ResolutionError = _dereq_('../ResolutionError');

/**
 * After the next resolvers are invoked, use <code>Object.freeze</code> to make the resolved
 * instance immutable. This resolver does not operate on the component to avoid the possibility
 * of freezing it due to misconfiguration.
 *
 * @function
 * @exports Resolver:freezing
 */
module.exports = function freezing(ctx, res, next) {
  next();

  var inst = res.instance(true);
  if (inst === ctx.component()) {
    throw new ResolutionError("freezing resolver cannot freeze the component itself, only instances");
  }

  res.resolve(Object.freeze(res.instance()));
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/freezing.js","/resolver")
},{"../ResolutionError":7,"1YiZ5S":21}],18:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

module.exports = function loggingResolver(ctx, res, next) {
  console.log("Junkie: key stack: ", ctx.keyStack().join(' -> '));
  next();
  console.log("Junkie: resolved key", ctx.key(), "=", res.instance());
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/logging.js","/resolver")
},{"1YiZ5S":21}],19:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var ResolutionError = _dereq_('../ResolutionError');

/**
 * Injects dependencies by calling a method on the component instance.
 *
 * @function
 * @exports Resolver:method
 */
module.exports = function method(ctx, res, next) {

  next();

  var instance = res.instance(true);

  var targetMethod = this.arg(0, "Method resolver: must supply target method name");
  var m = instance[targetMethod];
  if (typeof m !== 'function') {
    throw new ResolutionError("Method resolver: Method not found: " + targetMethod);
  }

  var deps = this.args();
  deps.shift(); // Remove targetField
  deps = ctx.resolve(deps);

  m.apply(instance, deps.list);
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/method.js","/resolver")
},{"../ResolutionError":7,"1YiZ5S":21}],20:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

module.exports.assert = function(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
};

// Shamelessly lifted from browserified util shim for the sake of staying light
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  };
}

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/util.js","/")
},{"1YiZ5S":21}],21:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/process/browser.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/process")
},{"1YiZ5S":21}]},{},[9])
(9)
});