"use strict";
var assert = require('../util').assert;
var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance using a constructor.
 *
 * @function
 * @exports Resolver:constructor
 * @throws ResolutionError if the component is not a function.
 */
module.exports = function constructor(ctx, res, next, async) {
  res.instance(false);

  var Type = ctx.component();
  assert.type(Type,
    'function',
    "Constructor resolver: Component must be a function: " + (typeof Type),
    ResolutionError);

  var instance = Object.create(Type.prototype);

  function result(deps) {
    Type.apply(instance, deps.list);
    res.resolve(instance);
    next();
  }

  if (async) {
    ctx.resolved(this.args())
      .then(result)
      .catch(res.fail);
  } else {
    result(ctx.resolve(this.args()));
  }
};
