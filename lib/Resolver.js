"use strict";

var assert = require('./util').assert;
var ResolutionError = require('./ResolutionError');

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
  assignment: require('./resolver/assignment'),
  caching: require('./resolver/caching'),
  constructor: require('./resolver/constructor'),
  creator: require('./resolver/creator'),
  decorator: require('./resolver/decorator'),
  factory: require('./resolver/factory'),
  factoryMethod: require('./resolver/factoryMethod'),
  field: require('./resolver/field'),
  freezing: require('./resolver/freezing'),
  method: require('./resolver/method')
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
