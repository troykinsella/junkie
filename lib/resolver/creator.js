"use strict";

var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance using a <code>Object.create</code>.
 *
 * @function
 * @exports Resolver:creator
 */
module.exports = function creator(ctx, res, next) {
  res.instance(false);

  var deps = this.args();
  var targetInitializer = deps.shift();

  var instance = Object.create(ctx.component());

  if (targetInitializer) {
    deps = ctx.resolve(deps);

    var initializer = instance[targetInitializer];
    if (typeof initializer !== 'function') {
      throw new ResolutionError("Creator resolver: Initializer function not found: " + targetInitializer);
    }
    initializer.apply(instance, deps.list);
  }

  res.resolve(instance);

  next();
};
