"use strict";
var assert = require('../util').assert;
var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance using a <code>Object.create</code>.
 *
 * @function
 * @exports Resolver:creator
 * @throws ResolutionError
 */
module.exports = function creator(ctx, res, next) {
  res.instance(false);

  var deps = this.args();
  var targetInitializer = deps.shift();

  var instance = Object.create(ctx.component());

  if (targetInitializer) {
    deps = ctx.resolve(deps);

    var initializer = instance[targetInitializer];
    assert.type(initializer,
      'function',
      "Creator resolver: Initializer function not found: " + targetInitializer,
      ResolutionError);

    initializer.apply(instance, deps.list);
  }

  res.resolve(instance);

  next();
};
