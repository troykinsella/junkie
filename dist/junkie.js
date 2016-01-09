/**
 * junkie - An extensible dependency injection container library
 * @version v0.2.2
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

var ComponentResolver = new Resolver(function(ctx, res) {
  res.resolve(ctx.component());
});

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
 * @returns {String}
 */
C.key = function() {
  return this._key;
};

/**
 * Obtain the user-provided component instance.
 * @returns {*}
 */
C.instance = function() {
  return this._instance;
};

/**
 * Obtain the data store for this component.
 * @returns {Object}
 */
C.store = function() {
  return this._store;
};

/**
 * Use the given resolver middleware.
 * @param resolver {String|Function} The resolver to use. Supplying a String attempts to locate a standard resolver
 *        by name. Supplying a Function uses the Function itself as the resolver implementation.
 * @see Resolver
 * @returns {Component} <code>this</code>.
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

C._resolverChain = function() {
  var resolvers = this._containerResolvers.concat(this._resolvers);
  if (this._resolvers.length === 0) {
    resolvers.push(ComponentResolver);
  }
  return resolvers;
};

C._checkCircularDeps = function(ctx) {
  // Check for circular dependencies
  var seenKeys = {},
      key;
  do {
    key = ctx.key();
    if (seenKeys[key]) {
      throw new ResolutionError("Circular dependency: " + key);
    }
    seenKeys[key] = true;
    ctx = ctx.previous();
  } while (ctx);
};

C._commitResolution = function(res, options) {
  // A commit may be attempted twice if the resolver fails the resolution and calls next
  if (!res._committed) {
    if (!options.optional && !res.failed() && !res.resolved()) {
      throw new ResolutionError("Resolver chain failed to resolve a component instance");
    }
    if (!options.async && res.failed()) {
      throw res.error();
    }

    res._commit();
  }
};

C._callResolverChain = function(resolvers, res, ctx, options) {
  var i = 0;

  var next = function() {
    // Grab the next resolver
    var r = resolvers[i++];

    // No resolver? -> commit and quit
    if (!r) {
      return this._commitResolution(res, options);
    }

    // Execute the resolver
    r.resolve(ctx, res, next, options.async);

    // Failed or finished? -> commit and quit
    if (res.failed() || res.isDone()) {
      return this._commitResolution(res, options);
    }

    // Resolver didn't call next? -> Do it for 'em
    if (!r.acceptsNextArg()) {
      next();
    }
  }.bind(this);

  next();
};

C._checkSync = function(resolvers, options) {
  var async = resolvers.some(function(r) {
    return r.requiresAsync();
  });
  if (!options.async && async) {
    throw new ResolutionError("Asynchronous-only resolver called in a synchronous context");
  }
};

/**
 * Resolve an instance for this component.
 * @param options {Object} The optional resolution options.
 * @returns {Resolution}
 */
C.resolve = function(options) {
  options = options || {};

  var res = new Resolution();
  var ctx = this._createContext(options);
  var resolvers = this._resolverChain();

  this._checkSync(resolvers, options);

  this._callResolverChain(resolvers, res, ctx, options);

  return options.async
    ? res.committed()
    : res.instance();
};

module.exports = Component;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Component.js","/")
},{"./Resolution":5,"./ResolutionContext":6,"./ResolutionError":7,"./Resolver":8,"1YiZ5S":23}],2:[function(_dereq_,module,exports){
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
  },
  keys: function() {
    return [];
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
 * @returns {Container|null} The parent container or <code>null</code>
 */
C.parent = function() {
  return this._parent === nullContainer
    ? null
    : this._parent;
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

  return new Container(this, resolvers);
};

/**
 * Use the given resolver middleware.
 * @param resolver {String|Function} The resolver to use. Supplying a String attempts to locate a standard resolver
 *        by name. Supplying a Function uses the Function itself as the resolver implementation.
 * @returns {Container} <code>this</code>.
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
 * @returns {RegistrationBuilder} A registration builder to configure the registration.
 *
 * @throws Error if key is not a string
 * @throws Error if component is not defined or <code>null</code>.
 */
C.register = function(key, component) {
  this._checkDisposed();

  assert.type(key, 'string', "key must be a string");
  assert(component !== undefined, "component must be defined");

  var comp = this._createComponent(key, component);
  this._registry[key] = comp;

  return new RegistrationBuilder(comp);
};

C._createComponent = function(key, component) {
  return new Component(key, component, this, this._containerResolvers);
};

C._get = function(key) {
  assert.type(key, 'string', "key must be a string");
  return this._registry
    ? this._registry[key]
    : null; // If the container was disposed, behave like a 'not found' so we continue searching the parent
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
 * @returns {*|null} The resulting component instance.
 *
 * @throws Error if key is not a string.
 * @throws ResolutionError when the mandatory key cannot be located.
 * @throws ResolutionError when a failure occurs during the resolution process.
 * @throws ResolutionError if any resolver completes asynchronously, in which case, #resolved should be used.
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
  return comp.resolve(options);
};

/**
 * The same as the #resolve method, except that this variant allows asynchronous resolvers, and returns a
 * promise rather than the resolution result. All potential errors thrown by the #resolve method
 * are not thrown by this method, but instead will reject the returned promise.
 *
 * @param key {String} The component key with which to obtain an instance.
 * @param options {Object|undefined} Optional configuration options
 * @param options.optional {boolean} When <code>true</code>, in the event that the component cannot be resolved
 *        return <code>null</code> instead of throwing a ResolutionError.
 * @returns {Promise} An ES6 promise capturing the result of the resolution.
 */
C.resolved = function(key, options) {
  options = options || {};
  options.async = true;

  try {
    return this.resolve(key, options);
  } catch (e) {
    return Promise.reject(e);
  }
};

/**
 * Obtain an array of key names known to this container and, optionally, parent containers.
 *
 * @param includeParent {boolean} Include keys registered with the parent container, if any. Defaults to <code>false</code>.
 * @returns {Array} A set of key names.
 */
C.keys = function(includeParent) {
  var keys = {};
  var addKey = function(key) {
    keys[key] = true;
  };
  if (includeParent) {
    this._parent.keys().forEach(addKey);
  }
  Object.keys(this._registry).forEach(addKey);

  return Object.keys(keys);
};

module.exports = Container;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Container.js","/")
},{"./Component":1,"./RegistrationBuilder":4,"./ResolutionError":7,"./Resolver":8,"./util":21,"1YiZ5S":23}],3:[function(_dereq_,module,exports){
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
 * @returns {String} The dependency key.
 */
D.key = function() {
  return this._key;
};

/**
 * Determine if the dependency is optional.
 * @returns {boolean} <code>true</code> for an optional dependency.
 */
D.optional = function() {
  return this._optional;
};

/**
 *
 * @param key {String|Dependency}
 * @returns {Dependency}
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
},{"./util":21,"1YiZ5S":23}],4:[function(_dereq_,module,exports){
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
},{"./Resolver":8,"1YiZ5S":23}],5:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
/*jshint eqnull:true */
var EventEmitter = _dereq_('events').EventEmitter;
var util = _dereq_('./util');
var ResolutionError = _dereq_('./ResolutionError');

var assert = util.assert;

/**
 * <strong>Private constructor</strong>. Instances are normally created internally and passed to resolvers.
 * @constructor
 */
function Resolution() {
  EventEmitter.call(this);
  this._done = false;

  this.fail = this.fail.bind(this); // Bind so resolution.fail can be used as a promise catch() handler
}
util.inherits(Resolution, EventEmitter);

/** @lends Resolution# */
var R = Resolution.prototype;

/**
 * Resolve the given instance of a component. This will be come the result of the {@link Container#resolve} call that
 * triggered this resolution.
 * @param instance {*|null} The instance to resolve.
 */
R.resolve = function(instance) {
  assert(instance !== undefined,
    "Resolver attempted to resolve undefined instance",
    ResolutionError);
  assert(!this._committed,
    "Resolution has already been committed",
    ResolutionError);
  this._instance = instance;
};

/**
 *
 * @returns {boolean}
 */
R.resolved = function() {
  return this._instance !== undefined;
};

/**
 * Fail this resolution with the given error.
 * @param error {Error} The error representing the cause of the resolution failure.
 */
R.fail = function(error) {
  this._error = error;
};

/**
 * Determine if the resolution has failed.
 * @returns {boolean} <code>true</code> if #fail was called with an error.
 */
R.failed = function() {
  return !!this._error;
};

/**
 * Mark this resolution as done regardless of the current resolved or failed state. "Done" means that, even though
 * a resolver may call the <code>next()</code> callback, the process will be aborted and no further resolvers will
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
 * @returns {*|null}
 * @throws ResolutionError when <code>require</code> is <code>true</code> and the instance isn't defined
 *                         or <code>require</code> is <code>false</code> and the instance is defined.
 */
R.instance = function(_dereq_) {
  var i = this._instance;

  if (_dereq_ !== undefined) {
    assert(!_dereq_ || i != null,
      "Resolver requires instance to be resolved",
      ResolutionError);
    assert(_dereq_ || i == null,
      "Resolver requires instance to not yet be resolved",
      ResolutionError);
  }

  return i;
};

/**
 * Get the error that failed the resolution. This error was set by the {@link #fail} method.
 * @returns {Error|null} The resolution failure error, or <code>null</code> if not failed.
 */
R.error = function() {
  return this._error || null;
};

/**
 * Determine if this resolution is done; that further resolvers will not be invoked.
 * @returns {boolean} The done state of this component resolution.
 */
R.isDone = function() {
  return !!this._done;
};

/**
 * Mark this bastard as committed.
 * @private
 */
R._commit = function() {
  assert(!this._committed, "Resolution#commit called twice");
  this._committed = true;
  this.emit('committed', this);
};

/**
 *
 * @param resolve
 * @param reject
 * @private
 */
R._onCommit = function(resolve, reject) {
  this.once('committed', function() {
    if (this.failed()) {
      return reject(this.error());
    }
    resolve(this.instance());
  }.bind(this));
};

/**
 * Obtain an ES6 Promise that will be resolved when the final instance and state has been resolved.
 * Otherwise, it will be rejected with the cause of the resolution failure.
 * @returns {Promise}
 */
R.committed = function() {
  if (this._committed) {
    return Promise.resolve(this.instance());
  }
  return new Promise(this._onCommit.bind(this));
};

R.toString = function() {
  return "Resolution {" +
    "instance: " + this.instance() +
    ", error: " + this.error() +
    ", done: " + this.isDone() +
    "}";
};

module.exports = Resolution;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Resolution.js","/")
},{"./ResolutionError":7,"./util":21,"1YiZ5S":23,"events":22}],6:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var Dependency = _dereq_('./Dependency');

/**
 * <strong>Private constructor</strong>. Instances are normally created internally and passed to resolvers.
 * @param options
 * @constructor
 */
function ResolutionContext(options) {
  if (!options ||
    !options.container ||
    !options.key ||
    options.component === undefined ||
    !options.store)
  {
    throw new Error("Must supply options: container, key, component, store");
  }

  Object.keys(options).forEach(function(key) {
    this['_' + key] = options[key];
  }.bind(this));
}

/** @lends ResolutionContext# */
var RC = ResolutionContext.prototype;

/**
 * Obtain the previous context in the resolution chain.
 * @returns {ResolutionContext|null}
 */
RC.previous = function() {
  return this._previous || null;
};

/**
 * Obtain a list of keys for resolutions that triggered this resolution. This list will
 * always have at least one element, and the last element always being the same as
 * this context's #key result.
 * @returns {Array.<String>} A stack of key names.
 */
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
 * @returns {String} The component key.
 */
RC.key = function() {
  return this._key;
};

/**
 * Get the component being resolved. This is the same instance
 * that was passed into the {@link Container#register} method.
 * @returns {*}
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
 *
 * @param dep
 * @returns {*}
 * @private
 */
RC._resolveDep = function(dep, options, async) {
  return this._container.resolve(dep.key(), {
    optional: dep.optional(),
    resolutionContext: this,
    async: async
  });
};

/**
 * Resolve the given Dependency instance or instances using the same container in which
 * the component for this resolution lives.
 *
 * @param deps {String|Array.<String>|Dependency|Array.<Dependency>} A Dependency instance or Array of instances.
 * @param options {Object|undefined} Optional configuration options.
 *
 * @returns {{map: {}, list: Array}} A structure containing resolved dependencies. The 'map' property
 */
RC.resolve = function(deps, options) {
  options = options || {};

  var single = !Array.isArray(deps);
  if (single) {
    deps = [ deps ];
  }

  var resolvedDeps =
    deps.map(function(dep) {
      return Dependency.getOrCreate(dep, options);
    })
    .reduce(function(struct, dep) {
      var resolvedDep = this._resolveDep(dep, options, false);
      struct.map[dep.key()] = resolvedDep;
      struct.list.push(resolvedDep);
      return struct;
    }.bind(this), {
      map: {},
      list: []
    });

  if (single) {
    return resolvedDeps.list[0];
  }

  return resolvedDeps;
};


RC.resolved = function(deps, options) {
  var single = !Array.isArray(deps);
  if (single) {
    deps = [ deps ];
  }

  var struct = {
    map: {},
    list: []
  };

  var promises =
    deps.map(function(dep) {
      return Dependency.getOrCreate(dep, options);
    })
    .map(function(dep) {
      return this._resolveDep(dep, options, true).then(function(resolvedDep) {
        struct.map[dep.key()] = resolvedDep;
        struct.list.push(resolvedDep);
      });
    }.bind(this), {});

  return Promise.all(promises).then(function() {
    if (single) {
      return struct.list[0];
    }
    return struct;
  });
};


RC.toString = function() {
  return "ResolutionContext {" +
    "keyStack: " + JSON.stringify(this.keyStack()) +
    ", storeKeys: " + JSON.stringify(Object.keys(this.store())) +
    "}";
};

module.exports = ResolutionContext;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/ResolutionContext.js","/")
},{"./Dependency":3,"1YiZ5S":23}],7:[function(_dereq_,module,exports){
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
},{"./util":21,"1YiZ5S":23}],8:[function(_dereq_,module,exports){
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
  assert.type(impl,
    'function',
    "Resolver must be a function: " + impl);
  this._impl = impl;
  this._args = args || [];
}

/** @lends Resolver# */
var R = Resolver.prototype;

R.resolve = function(ctx, res, next, async) {
  var resolverThis = this._createResolverThis();
  try {
    this._impl.call(resolverThis, ctx, res, next, async);
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

R.requiresAsync = function() {
  return this.acceptsNextArg() && !this.acceptsAsyncArg();
};

R.acceptsNextArg = function() {
  return this._impl.length >= 3;
};

R.acceptsAsyncArg = function() {
  return this._impl.length === 4;
};

// Dynamic requires would be nice, but browserify shits the bed
Resolver.StandardResolvers = Object.freeze({
  assignment: _dereq_('./resolver/assignment'),
  caching: _dereq_('./resolver/caching'),
  constructor: _dereq_('./resolver/constructor'),
  creator: _dereq_('./resolver/creator'),
  decorator: _dereq_('./resolver/decorator'),
  factory: _dereq_('./resolver/factory'),
  factoryMethod: _dereq_('./resolver/factoryMethod'),
  field: _dereq_('./resolver/field'),
  freezing: _dereq_('./resolver/freezing'),
  method: _dereq_('./resolver/method'),
  sealing: _dereq_('./resolver/sealing')
});

Resolver.normalize = function(resolver, args) {
  assert(!!resolver, "resolver must be defined");
  if (typeof resolver === 'string') {
    resolver = Resolver.StandardResolvers[resolver];
  }

  assert.type(resolver, [ 'object', 'function' ], "resolver must be a function or object");

  if (!(resolver instanceof Resolver)) {
    resolver = new Resolver(resolver, args);
  }

  return resolver;
};

module.exports = Resolver;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Resolver.js","/")
},{"./ResolutionError":7,"./resolver/assignment":10,"./resolver/caching":11,"./resolver/constructor":12,"./resolver/creator":13,"./resolver/decorator":14,"./resolver/factory":15,"./resolver/factoryMethod":16,"./resolver/field":17,"./resolver/freezing":18,"./resolver/method":19,"./resolver/sealing":20,"./util":21,"1YiZ5S":23}],9:[function(_dereq_,module,exports){
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
 * @returns Container
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

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_fb02f5dc.js","/")
},{"./Container":2,"./ResolutionError":7,"1YiZ5S":23}],10:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

/**
 * An assignment resolver takes dependencies and copies their
 * into the resolution instance using <code>Object.assign</code>.
 *
 * @function
 * @exports Resolver:assignment
 */
module.exports = function assignment(ctx, res, next, async) {

  var instance = res.instance(true);

  function result(deps) {
    deps.list.forEach(function(dep) {
      Object.assign(instance, dep);
    });
    next();
  }

  if (async) {
    ctx.resolved(this.args())
      .then(result)
      .catch(res.fail);
  } else {
    result(ctx.resolve(this.args()));
  }
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/assignment.js","/resolver")
},{"1YiZ5S":23}],11:[function(_dereq_,module,exports){
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
module.exports = function caching(ctx, res) {
  var cached = ctx.store(cacheKey);
  if (cached) {
    res.resolve(cached);
    return res.done();
  }

  res.once('committed', function() {
    ctx.store(cacheKey, res.instance());
  });
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/caching.js","/resolver")
},{"1YiZ5S":23}],12:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var assert = _dereq_('../util').assert;
var ResolutionError = _dereq_('../ResolutionError');

// This madness is necessary because Function.apply/call doesn't work on ES6 classes.
function callCtor(Type, deps) {
  var i;
  switch (deps.length) {
    case 0:  i = new Type(); break;
    case 1:  i = new Type(deps[0]); break;
    case 2:  i = new Type(deps[0], deps[1]); break;
    case 3:  i = new Type(deps[0], deps[1], deps[2]); break;
    case 4:  i = new Type(deps[0], deps[1], deps[2], deps[3]); break;
    case 5:  i = new Type(deps[0], deps[1], deps[2], deps[3], deps[4]); break;
    case 6:  i = new Type(deps[0], deps[1], deps[2], deps[3], deps[4], deps[5]); break;
    case 7:  i = new Type(deps[0], deps[1], deps[2], deps[3], deps[4], deps[5], deps[6]); break;
    case 8:  i = new Type(deps[0], deps[1], deps[2], deps[3], deps[4], deps[5], deps[6], deps[7]); break;
    case 9:  i = new Type(deps[0], deps[1], deps[2], deps[3], deps[4], deps[5], deps[6], deps[7], deps[8]); break;
    case 10: i = new Type(deps[0], deps[1], deps[2], deps[3], deps[4], deps[5], deps[6], deps[7], deps[8], deps[9]); break;
    default: throw new Error("Seriously? You have more than 10 constructor parameters?");
  }
  return i;
}

/**
 * Creates a new component instance using a constructor.
 *
 * @function
 * @exports Resolver:constructor
 * @throws ResolutionError if the component is not a function.
 */
module.exports = function constructor(ctx, res, next, async) {
  res.instance(false);

  var Type = ctx.component();
  assert.type(Type,
    'function',
    "Constructor resolver: Component must be a function: " + (typeof Type),
    ResolutionError);

  function result(deps) {
    var instance = callCtor(Type, deps.list);
    res.resolve(instance);
    next();
  }

  if (async) {
    ctx.resolved(this.args())
      .then(result)
      .catch(res.fail);
  } else {
    result(ctx.resolve(this.args()));
  }
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/constructor.js","/resolver")
},{"../ResolutionError":7,"../util":21,"1YiZ5S":23}],13:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var assert = _dereq_('../util').assert;
var ResolutionError = _dereq_('../ResolutionError');

/**
 * Creates a new component instance using a call to <code>Object.create</code>
 * passing the component as the prototype. An optional argument is accepted
 * which is the <code>properties</code> argument to <code>Object.create</code>.
 * The argument can either be the properties object, or a string dependency key
 * pointing to the properties object.
 *
 * @function
 * @exports Resolver:creator
 * @throws ResolutionError
 */
module.exports = function creator(ctx, res, next, async) {
  res.instance(false);

  var comp = ctx.component();
  assert.type(comp,
    'object',
    'creator resolver component must be an object',
    ResolutionError);

  var props = this.args()[0];

  function result(resolvedProps) {
    if (resolvedProps) {
      assert.type(resolvedProps,
        'object',
        "create properties must be an object",
        ResolutionError);
    }
    var instance = Object.create(comp, resolvedProps);
    res.resolve(instance);
    next();
  }

  if (typeof props === 'string') {
    if (async) {
      ctx.resolved(props)
        .then(result)
        .catch(res.fail);
    } else {
      result(ctx.resolve(props));
    }
  } else {
    result(props);
  }
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/creator.js","/resolver")
},{"../ResolutionError":7,"../util":21,"1YiZ5S":23}],14:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var assert = _dereq_('../util').assert;
var ResolutionError = _dereq_('../ResolutionError');


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
 * @throws ResolutionError if the decorator factory is not a function or returns <code>undefined<code> or <code>null</code>
 */
module.exports = function decorator(ctx, res, next, async) {
  var dec = this.arg(0,
    "decorator resolver requires argument of string dependency key or factory function");

  function result(resolvedDecFn) {
    assert.type(resolvedDecFn,
      'function',
      "decorator must be a factory function",
      ResolutionError);

    var decorated = resolvedDecFn(res.instance() || ctx.component());
    if (decorated === undefined || decorated === null) {
      var err = new ResolutionError('decorator factory did not return instance when resolving: ' + ctx.key());
      return res.fail(err);
    }
    res.resolve(decorated);
    next();
  }

  if (typeof dec === 'string') {
    if (async) {
      ctx.resolved(dec)
        .then(result)
        .catch(res.fail);
    } else {
      result(ctx.resolve(dec));
    }
  } else {
    result(dec);
  }
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/decorator.js","/resolver")
},{"../ResolutionError":7,"../util":21,"1YiZ5S":23}],15:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var assert = _dereq_('../util').assert;
var ResolutionError = _dereq_('../ResolutionError');

/**
 * Creates a new component instance by calling a factory function, passing in dependencies.
 *
 * @function
 * @exports Resolver:factory
 */
module.exports = function factory(ctx, res, next, async) {
  var factoryFn = res.instance() || ctx.component();
  assert.type(factoryFn,
    'function',
    "Factory resolver: Component must be a function: " + (typeof factoryFn),
    ResolutionError);

  function result(deps) {
    var instance = factoryFn.apply(null, deps.list);
    res.resolve(instance);
    next();
  }

  if (async) {
    ctx.resolved(this.args())
      .then(result)
      .catch(res.fail);
  } else {
    result(ctx.resolve(this.args()));
  }
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/factory.js","/resolver")
},{"../ResolutionError":7,"../util":21,"1YiZ5S":23}],16:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var assert = _dereq_('../util').assert;
var ResolutionError = _dereq_('../ResolutionError');

/**
 * Creates a new component instance by calling a factory method on the resolved instance or
 * the component itself.
 *
 * @function
 * @exports Resolver:factoryMethod
 */
module.exports = function factoryMethod(ctx, res, next, async) {
  var instance = res.instance() || ctx.component();

  var targetMethod = this.arg(0, "FactoryMethod resolver: must supply target method name");
  var m = instance[targetMethod];
  assert.type(m,
    'function',
    "FactoryMethod resolver: Method not found: " + targetMethod,
    ResolutionError);

  var deps = this.args();
  deps.shift(); // Remove targetField

  function result(resolvedDeps) {
    var r = m.apply(instance, resolvedDeps.list);
    res.resolve(r);
    next();
  }

  if (async) {
    ctx.resolved(deps)
      .then(result)
      .catch(res.fail);
  } else {
    result(ctx.resolve(deps));
  }
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/factoryMethod.js","/resolver")
},{"../ResolutionError":7,"../util":21,"1YiZ5S":23}],17:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var ResolutionError = _dereq_('../ResolutionError');

/**
 * Injects a dependency by assigning to a field of the component instance.
 *
 * @function
 * @exports Resolver:field
 */
module.exports = function field(ctx, res, next, async) {
  var instance = res.instance(true);

  var targetField = this.arg(0, "Field resolver: must supply target field name");

  var dep = this.args();
  dep.shift(); // Remove targetField
  if (dep.length !== 1) {
    throw new ResolutionError("Field resolver: Must supply exactly one dependency");
  }
  dep = dep[0];

  function result(resolvedDep) {
    instance[targetField] = resolvedDep;
    next();
  }

  if (async) {
    ctx.resolved(dep)
      .then(result)
      .catch(res.fail);
  } else {
    result(ctx.resolve(dep));
  }
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/field.js","/resolver")
},{"../ResolutionError":7,"1YiZ5S":23}],18:[function(_dereq_,module,exports){
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
module.exports = function freezing(ctx, res) {
  var inst = res.instance(true);
  if (inst === ctx.component()) {
    throw new ResolutionError("freezing resolver cannot freeze the component itself, only instances");
  }

  res.resolve(Object.freeze(res.instance()));
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/freezing.js","/resolver")
},{"../ResolutionError":7,"1YiZ5S":23}],19:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var assert = _dereq_('../util').assert;
var ResolutionError = _dereq_('../ResolutionError');

/**
 * Injects dependencies by calling a method on the component instance.
 *
 * @function
 * @exports Resolver:method
 */
module.exports = function method(ctx, res, next, async) {
  var instance = res.instance(true);
  var targetMethod = this.arg(0, "Method resolver: must supply target method name");
  var m = instance[targetMethod];
  assert.type(m,
    'function',
    "Method resolver: Method not found: " + targetMethod,
    ResolutionError);

  var deps = this.args();
  deps.shift(); // Remove targetField

  function result(resolvedDeps) {
    m.apply(instance, resolvedDeps.list);
    next();
  }

  if (async) {
    ctx.resolved(deps)
      .then(result)
      .catch(res.fail);
  } else {
    result(ctx.resolve(deps));
  }
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/method.js","/resolver")
},{"../ResolutionError":7,"../util":21,"1YiZ5S":23}],20:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var ResolutionError = _dereq_('../ResolutionError');

/**
 * After the next resolvers are invoked, use <code>Object.seal</code> to make the resolved
 * instance properties non-deletable. This resolver does not operate on the component to avoid the possibility
 * of sealing it due to misconfiguration.
 *
 * @function
 * @exports Resolver:sealing
 */
module.exports = function sealing(ctx, res) {
  var inst = res.instance(true);
  if (inst === ctx.component()) {
    throw new ResolutionError("sealing resolver cannot seal the component itself, only instances");
  }

  res.resolve(Object.seal(res.instance()));
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/sealing.js","/resolver")
},{"../ResolutionError":7,"1YiZ5S":23}],21:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

function isType(ref, type) {
  return type === 'array'
    ? Array.isArray(ref)
    : typeof ref === type;
}

function assert(condition, message, ErrorType) {
  if (!condition) {
    var E = ErrorType || Error;
    throw new E(message);
  }
}

assert.type = function(ref, type, message, ErrorType) {
  var pass = Array.isArray(type)
    ? type.some(function(t) { return isType(ref, t); })
    : isType(ref, type);
  assert(pass, message, ErrorType);
};

module.exports.assert = assert;

// "inherits" function: shamelessly lifted from browserified util shim for the sake of
// not including the entire util module
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
},{"1YiZ5S":23}],22:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/events/events.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/events")
},{"1YiZ5S":23}],23:[function(_dereq_,module,exports){
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
},{"1YiZ5S":23}]},{},[9])
(9)
});