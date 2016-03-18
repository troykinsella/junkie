"use strict";

var ResolutionError = require('../ResolutionError');

/**
 * Injects a dependency by assigning to a field of the component instance.
 *
 * @function
 * @exports Resolver:field
 */
module.exports = function field(ctx, res, next) {
  var instance = res.instance(true);

  var targetField = this.arg(0, "Field resolver: must supply target field name");

  var dep = this.args();
  dep.shift(); // Remove targetField
  if (dep.length !== 1) {
    throw new ResolutionError("Field resolver: Must supply exactly one dependency");
  }
  dep = dep[0];

  ctx.resolve(dep)
    .then(function(resolvedDep) {
      instance[targetField] = resolvedDep;
      next();
    })
    .catch(function(err) {
      res.fail(err);
      next();
    });
};
