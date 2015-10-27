
const assert = require('assert');
const util = require('./util');
const Resolver = require('./Resolver');
const Resolution = require('./Resolution');
const ResolutionContext = require('./ResolutionContext');

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

const C = Component.prototype;

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
  const next = function() {
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

/**
 *
 * @return {Resolution}
 */
C.resolve = function() {
  const res = new Resolution(this.instance());
  const ctx = new ResolutionContext(this._container, this.key(), this.instance(), this.descriptor());

  const phases = Object.keys(Resolver.Phase);
  var i = 0;

  //console.log("Component#resolve", this);

  const next = function() {
    const phase = phases[i++];
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
