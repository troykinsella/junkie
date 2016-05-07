"use strict";

/**
 * Invoke the specified method as part of resolving the instance on which the method is called, optionally configuring
 * dependencies to be passed as method parameters.
 *
 * @name assignment
 * @param {string|object} dependencyKeyOrObject A dependency key of the object with which to
 *        assign to the instance being resolved, or the object itself.
 * @function
 * @memberOf Resolver:assignment#
 */

/**
 * An assignment resolver takes dependencies and copies their properties
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
