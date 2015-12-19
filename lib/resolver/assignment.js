"use strict";

/**
 * An assignment resolver takes dependencies and copies their
 * into the resolution instance using <code>Object.assign</code>.
 *
 * @function
 * @exports Resolver:assignment
 */
module.exports = function assignment(ctx, res, next, async) {

  var instance = res.instance(true);

  function result(deps) {
    deps.list.forEach(function(dep) {
      Object.assign(instance, dep);
    });
    next();
  }

  if (async) {
    ctx.resolved(this.args())
      .then(result)
      .catch(res.fail);
  } else {
    result(ctx.resolve(this.args()));
  }
};
