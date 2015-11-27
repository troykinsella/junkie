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
 * @return {ResolutionContext|null}
 */
RC.previous = function() {
  return this._previous || null;
};

/**
 * Obtain a list of keys for resolutions that triggered this resolution. This list will
 * always have at least one element, and the last element always being the same as
 * this context's #key result.
 * @return {Array.<String>} A stack of key names.
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
  return "ResolutionContext {" +
    "keyStack: " + JSON.stringify(this.keyStack()) +
    ", storeKeys: " + JSON.stringify(Object.keys(this.store())) +
    "}";
};

module.exports = ResolutionContext;
