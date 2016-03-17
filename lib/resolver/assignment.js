"use strict";

/**
 * An assignment resolver takes dependencies and copies their
 * into the resolution instance using <code>Object.assign</code>.
 *
 * @function
 * @exports Resolver:assignment
 */
module.exports = function assignment(ctx, res, next) {
  var instance = res.instance(true);

  ctx.resolve(this.args())
    .then(function(deps) {
      deps.list.forEach(function(dep) {
        Object.assign(instance, dep);
      });
      next();
    })
    .catch(function(err) {
      res.fail(err);
      next();
    });
};
