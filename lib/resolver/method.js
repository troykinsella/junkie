"use strict";
var assert = require('../util').assert;
var ResolutionError = require('../ResolutionError');

/**
 * Injects dependencies by calling a method on the component instance.
 *
 * @function
 * @exports Resolver:method
 */
module.exports = function method(ctx, res, next, async) {
  var instance = res.instance(true);
  var targetMethod = this.arg(0, "Method resolver: must supply target method name");
  var m = instance[targetMethod];
  assert.type(m,
    'function',
    "Method resolver: Method not found: " + targetMethod,
    ResolutionError);

  var deps = this.args();
  deps.shift(); // Remove targetField

  function result(resolvedDeps) {
    m.apply(instance, resolvedDeps.list);
    next();
  }

  if (async) {
    ctx.resolved(deps)
      .then(result)
      .catch(res.fail);
  } else {
    result(ctx.resolve(deps));
  }
};
