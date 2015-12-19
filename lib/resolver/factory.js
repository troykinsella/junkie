"use strict";
var assert = require('../util').assert;
var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance by calling a factory function, passing in dependencies.
 *
 * @function
 * @exports Resolver:factory
 */
module.exports = function factory(ctx, res, next, async) {
  var factoryFn = res.instance() || ctx.component();
  assert.type(factoryFn,
    'function',
    "Factory resolver: Component must be a function: " + (typeof factoryFn),
    ResolutionError);

  function result(deps) {
    var instance = factoryFn.apply(null, deps.list);
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
