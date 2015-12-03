"use strict";
var assert = require('../util').assert;
var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance by calling a factory function, passing in dependencies.
 *
 * @function
 * @exports Resolver:factory
 */
module.exports = function factory(ctx, res) {
  var factoryFn = res.instance() || ctx.component();
  assert.type(factoryFn,
    'function',
    "Factory resolver: Component must be a function: " + (typeof factoryFn),
    ResolutionError);

  var deps = ctx.resolve(this.args());
  var instance = factoryFn.apply(null, deps.list);
  res.resolve(instance);
};
