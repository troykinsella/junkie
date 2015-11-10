"use strict";

var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance by calling a factory function.
 *
 * @function
 * @exports Resolver:factory
 */
module.exports = function factory(ctx, res, next) {
  var factoryFn = res.instanceOrComponent();
  if (typeof factoryFn !== 'function') {
    throw new ResolutionError("Factory resolver: Component must be a function: " + (typeof factoryFn));
  }

  var deps = ctx.resolve(this.args());
  var instance = factoryFn.apply(factory, deps.list);
  res.resolve(instance);

  next();
};
