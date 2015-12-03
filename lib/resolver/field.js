"use strict";

var ResolutionError = require('../ResolutionError');

/**
 * Injects a dependency by assigning to a field of the component instance.
 *
 * @function
 * @exports Resolver:field
 */
module.exports = function field(ctx, res) {
  var instance = res.instance(true);

  var targetField = this.arg(0, "Field resolver: must supply target field name");

  var deps = this.args();
  deps.shift(); // Remove targetField
  if (deps.length !== 1) {
    throw new ResolutionError("Field resolver: Must supply exactly one dependency");
  }

  deps = ctx.resolve(deps);

  instance[targetField] = deps.list[0];
};
