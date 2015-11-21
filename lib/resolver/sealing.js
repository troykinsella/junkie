"use strict";

var ResolutionError = require('../ResolutionError');

/**
 * After the next resolvers are invoked, use <code>Object.seal</code> to make the resolved
 * instance properties non-deletable. This resolver does not operate on the component to avoid the possibility
 * of sealing it due to misconfiguration.
 *
 * @function
 * @exports Resolver:sealing
 */
module.exports = function sealing(ctx, res, next) {
  next();

  var inst = res.instance(true);
  if (inst === ctx.component()) {
    throw new ResolutionError("sealing resolver cannot seal the component itself, only instances");
  }

  res.resolve(Object.seal(res.instance()));
};
