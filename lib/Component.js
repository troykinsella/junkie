"use strict";
var Resolver = require('./Resolver');
var Resolution = require('./Resolution');
var ResolutionContext = require('./ResolutionContext');
var ResolutionError = require('./ResolutionError');

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
 * @return {Resolution}
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
