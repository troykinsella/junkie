"use strict";

var assert = require('assert');

// Dynamic requires would be nice, but browserify shits the bed
var standardResolvers = {
  caching: require('./resolver/caching'),
  injector: require('./resolver/injector')
};

/**
 *
 * @param impl {Function} The resolver implementation.
 * @constructor
 */
function Resolver(impl) {
  assert(typeof impl === 'function', "Resolver must be a function: " + impl);
  this._impl = impl;
}

var R = Resolver.prototype;

R.resolve = function(ctx, res, next) {
  try {
    this._impl(ctx, res, next);
  } catch (e) {
    res.fail(e);
    return next();
  }
};


Resolver.normalize = function(resolver) {
  assert(!!resolver, "resolver must be defined");
  if (typeof resolver === 'string') {
    resolver = standardResolvers[resolver];
  }

  assert(typeof resolver === 'object' ||
    typeof resolver === 'function', "resolver must be a function or object");

  if (!(resolver instanceof Resolver)) {
    resolver = new Resolver(resolver);
  }

  return resolver;
};

module.exports = Resolver;
