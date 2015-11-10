"use strict";

var ResolutionError = require('../ResolutionError');

/**
 * Injects dependencies by calling a method on the component instance.
 *
 * @function
 * @exports Resolver:method
 */
module.exports = function method(ctx, res, next) {

  next();

  var instance = res.instanceOrComponent();

  var targetMethod = this.arg(0, "Method resolver: must supply target method name");
  var m = instance[targetMethod];
  if (typeof m !== 'function') {
    throw new ResolutionError("Method resolver: Method not found: " + targetMethod);
  }

  var deps = this.args();
  deps.shift(); // Remove targetField
  deps = ctx.resolve(deps);

  m.apply(instance, deps.list);
};
