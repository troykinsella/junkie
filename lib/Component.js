"use strict";
var Resolver = require('./Resolver');
var Resolution = require('./Resolution');
var ResolutionContext = require('./ResolutionContext');
var ResolutionError = require('./ResolutionError');

function Component(key, instance, descriptor, container) {

  this._key = key;
  this._instance = instance;
  this._descriptor = descriptor;
  this._container = container;

  this._resolvers = [];
  this._store = {};
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

C.store = function() {
  return this._store;
};

C.use = function(resolver) {
  resolver = Resolver.normalize(resolver);
  this._resolvers.unshift(resolver);
  return this;
};


C._createContext = function(options) {
  var ctx = new ResolutionContext({
    previous: options.resolutionContext,
    container: this._container,
    key: this.key(),
    component: this.instance(),
    descriptor: this.descriptor(),
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


C.resolve = function(options) {
  options = options || {};

  var res = new Resolution(this.instance());
  var ctx = this._createContext(options);

  var i = 0;

  var next = function() {
    var r = this._resolvers[i++];
    if (!r || res.error() || res.isDone()) {
      return;
    }

    r.resolve(ctx, res, next);
  }.bind(this);

  next();
  if (!res.instance()) {
    res.resolve(res.component());
  }

  return res;
};

module.exports = Component;
