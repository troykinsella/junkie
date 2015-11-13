"use strict";

var ResolutionError = require('../ResolutionError');

/**
 * After the next resolvers are invoked, use <code>Object.freeze</code> to make the resolved
 * instance immutable. This resolver does not operate on the component to avoid the possibility
 * of freezing it due to misconfiguration.
 *
 * @function
 * @exports Resolver:freezing
 */
module.exports = function freezing(ctx, res, next) {
  next();

  var inst = res.instance(true);
  if (inst === ctx.component()) {
    throw new ResolutionError("freezing resolver cannot freeze the component itself, only instances");
  }

  res.resolve(Object.freeze(res.instance()));
};
