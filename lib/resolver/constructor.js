"use strict";

var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance using a constructor.
 *
 * @function
 * @exports Resolver:constructor
 */
module.exports = function constuctor(ctx, res, next) {
  if (res.instance()) {
    throw new ResolutionError("Constructor resolver: instance already created");
  }

  var Type = res.component();
  if (typeof Type !== 'function') {
    throw new ResolutionError("Constructor resolver: Component must be a function: " + (typeof Type));
  }

  var deps = ctx.resolve(this.args());
  var instance = Object.create(Type.prototype);
  Type.apply(instance, deps.list);
  res.resolve(instance);

  next();
};
