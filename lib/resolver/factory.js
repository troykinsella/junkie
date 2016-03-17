"use strict";
var util = require('../util');
var assert = util.assert;
var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance by calling a factory function, passing in dependencies.
 *
 * @function
 * @exports Resolver:factory
 */
module.exports = function factory(ctx, res, next) {
  var factoryFn = res.instance() || ctx.component();
  assert.type(factoryFn,
    'function',
    "Factory resolver: Component must be a function: " + (typeof factoryFn),
    ResolutionError);

  ctx.resolve(this.args())
    .then(function(deps) {
      var instance = factoryFn.apply(null, deps.list);
      res.resolve(instance);
      next();
    })
    .catch(function(err) {
      res.fail(err);
      next();
    });
};
