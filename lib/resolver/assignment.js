"use strict";

/**
 * An assignment resolver takes dependencies and copies their
 * into the resolution instance using <code>Object.assign</code>.
 *
 * @function
 * @exports Resolver:assignment
 */
module.exports = function assignment(ctx, res) {
  var instance = res.instance(true);

  var deps = ctx.resolve(this.args());
  deps.list.forEach(function(dep) {
    Object.assign(instance, dep);
  });

  res.resolve(instance);
};
