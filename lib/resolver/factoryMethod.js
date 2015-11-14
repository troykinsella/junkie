"use strict";

var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance by calling a factory method on the resolved instance or
 * the component itself.
 *
 * @function
 * @exports Resolver:factoryMethod
 */
module.exports = function factoryMethod(ctx, res, next) {
  var instance = res.instance() || ctx.component();

  var targetMethod = this.arg(0, "FactoryMethod resolver: must supply target method name");
  var m = instance[targetMethod];
  if (typeof m !== 'function') {
    throw new ResolutionError("FactoryMethod resolver: Method not found: " + targetMethod);
  }

  var deps = this.args();
  deps.shift(); // Remove targetField
  deps = ctx.resolve(deps);

  instance = m.apply(instance, deps.list);
  res.resolve(instance);

  next();
};
