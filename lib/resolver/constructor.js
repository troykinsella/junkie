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
module.exports = function constuctor(ctx, res) {
  res.instance(false);

  var Type = ctx.component();
  assert.type(Type,
    'function',
    "Constructor resolver: Component must be a function: " + (typeof Type),
    ResolutionError);

  var deps = ctx.resolve(this.args());
  var instance = Object.create(Type.prototype);
  Type.apply(instance, deps.list);
  res.resolve(instance);
};
