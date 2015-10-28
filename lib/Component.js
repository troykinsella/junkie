"use strict";
var util = require('./util');
var Resolver = require('./Resolver');
var Resolution = require('./Resolution');
var ResolutionContext = require('./ResolutionContext');
var ResolutionError = require('./ResolutionError');

/**
 *
 * @constructor
 */
function Component(key, instance, descriptor, container) {

  this._key = key;
  this._instance = instance;
  this._descriptor = descriptor;
  this._container = container;

  this._resolvers = [];

}

var C = Component.prototype;

C.key = function() {
  return this._key;
};

C.instance = function() {
  return this._instance;
};

C.descriptor = function() {
  return this._descriptor;
};

C.use = function(resolver) {
  //console.log("Component#use", resolver);
  resolver = util.normalizeResolver(resolver);
  //console.log("Component#use1", resolver);
  this._resolvers.push(resolver);
  //console.log("Component#use2", this);
  return this;
};

C._runPhase = function(ctx, res, nextPhase) {
  //console.log("_runPhase", arguments);

  var i = 0;
  var next = function() {
    var r = this._resolvers[i++];
    if (!r) {
      //console.log("nextPhase");
      return nextPhase();
    }
    if (res.error() || res.isDone()) {
      return res; // We're done here
    }

    //console.log("Calling resolver: ", r);
    r.resolve(ctx, res, next);
  }.bind(this);

  return next();
};

C._createContext = function(options) {
  var ctx = new ResolutionContext({
    previous: options.resolutionContext,
    container: this._container,
    key: this.key(),
    component: this.instance(),
    descriptor: this.descriptor()
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
 *
 * @return {Resolution}
 */
C.resolve = function(options) {
  options = options || {};

  var res = new Resolution(this.instance());
  var ctx = this._createContext(options);

  var phases = Object.keys(Resolver.Phase);
  var i = 0;

  //console.log("Component#resolve", this);

  var next = function() {
    var phase = phases[i++];
    if (!phase || res.error() || res.isDone()) {
      //console.log("resolve: done");
      return res;
    }

    ctx.phase(phase);
    return this._runPhase(ctx, res, next);
  }.bind(this);

  return (function() {
    next();
    if (!res.instance()) {
      res.resolve(res.component());
    }
    //console.log("resolve result:", res.instance());
    return res;
  })();
};

module.exports = Component;
