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
module.exports = function factoryMethod(ctx, res, next) {
  var instance = res.instance() || ctx.component();

  var targetMethod = this.arg(0, "FactoryMethod resolver: must supply target method name");
  var m = instance[targetMethod];
  assert.type(m,
    'function',
    "FactoryMethod resolver: Method not found: " + targetMethod,
    ResolutionError);

  var deps = this.args();
  deps.shift(); // Remove targetField

  ctx.resolve(deps)
    .then(function(resolvedDeps) {
      var r = m.apply(instance, resolvedDeps.list);
      res.resolve(r);
      next();
    })
    .catch(function(err) {
      res.fail(err);
      next();
    });
};
