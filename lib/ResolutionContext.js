"use strict";

var Dependency = require('./Dependency');

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
RC._resolveDep = function(dep) {
  return this._container.resolve(dep.key(), {
    optional: dep.optional(),
    resolutionContext: this
  });
};

/**
 * Resolve the given Dependency instance or instances using the same container in which
 * the component for this resolution lives.
 *
 * @param deps {String|Array.<String>|Dependency|Array.<Dependency>} A Dependency instance or Array of instances.
 * @param options {Object|undefined} Optional configuration options.
 *
 * @returns {Promise} A promise that resolves a structure containing resolved dependencies: <code>{map: {}, list: Array}</code>.
 */
RC.resolve = function(deps, options) {
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
      return this._resolveDep(dep).then(function(resolvedDep) {
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
