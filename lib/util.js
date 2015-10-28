"use strict";

var assert = require('assert');
var Resolver = require('./Resolver');

function normalizeResolver(resolver) {
  assert(!!resolver, "resolver must be defined");
  if (typeof resolver === 'string') {
    try {
      resolver = require('./resolver/' + resolver);
    } catch (e) {
      resolver = require(resolver);
    }
  }

  assert(typeof resolver === 'object' ||
         typeof resolver === 'function', "resolver must be a function or object");

  if (!(resolver instanceof Resolver)) {
    resolver = new Resolver(resolver);
  }

  return resolver;
}

module.exports = {
  normalizeResolver: normalizeResolver
};
