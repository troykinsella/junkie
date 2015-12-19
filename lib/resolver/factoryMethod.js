"use strict";
var assert = require('../util').assert;
var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance by calling a factory method on the resolved instance or
 * the component itself.
 *
 * @function
 * @exports Resolver:factoryMethod
 */
module.exports = function factoryMethod(ctx, res, next, async) {
  var instance = res.instance() || ctx.component();

  var targetMethod = this.arg(0, "FactoryMethod resolver: must supply target method name");
  var m = instance[targetMethod];
  assert.type(m,
    'function',
    "FactoryMethod resolver: Method not found: " + targetMethod,
    ResolutionError);

  var deps = this.args();
  deps.shift(); // Remove targetField

  function result(resolvedDeps) {
    var r = m.apply(instance, resolvedDeps.list);
    res.resolve(r);
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
