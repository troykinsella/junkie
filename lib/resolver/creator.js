"use strict";

var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance using a <code>Object.create</code>.
 *
 * @function
 * @exports Resolver:creator
 */
module.exports = function creator(ctx, res, next) {
  if (res.instance()) {
    throw new ResolutionError("Creator resolver: instance already created");
  }

  var deps = this.args();
  var targetInitializer = deps.shift();

  var instance = Object.create(res.component());

  if (targetInitializer) {
    deps = ctx.resolve(deps);

    var initializer = instance[targetInitializer];
    if (typeof initializer !== 'function') {
      throw new ResolutionError("Creator resolver: Initializer function not found: " + targetInitializer);
    }
    initializer.apply(instance, deps.list);

  } else {
    if (deps.length > 1) {
      throw new ResolutionError("Creator resolver: Initializer function not specified, but dependencies supplied");
    }
  }

  res.resolve(instance);

  next();
};
