"use strict";
var util = require('../util');
var ResolutionError = require('../ResolutionError');

function handleResult(result, opts, res, next) {
  if (result && util.isType(result, 'promise') && opts && opts.await) {
    result.then(function() {
      next();
    }).catch(function(err) {
      res.fail(err);
      next();
    });
  } else {
    next();
  }
}

/**
 * Invoke the specified method as part of resolving the instance on which the method is called, optionally configuring
 * dependencies to be passed as method parameters.
 *
 * @name method
 * @param {string} methodName The name of the method to invoke.
 * @param {...string} [dependencyKey] A dependency key to resolve and pass as an argument to the method.
 * @param {object} [options] An options object.
 * @param {boolean} [options.await] When <code>true</code>, and a <code>Promise</code> is returned from the specified
 *        method, the resolution of the instance on which the method is being called will not complete until the
 *        <code>Promise</code> resolves or fails.
 * @function
 * @memberOf Resolver:method#
 */

/**
 * Injects dependencies by calling a method on the component instance.
 *
 * @function
 * @exports Resolver:method
 */
module.exports = function method(ctx, res, next) {
  var instance = res.instance(true);
  var targetMethod = this.arg(0, "Method resolver: must supply target method name");
  var m = instance[targetMethod];
  util.assert.type(m,
    'function',
    "Method resolver: Method not found: " + targetMethod,
    ResolutionError);

  var deps = this.args();
  deps.shift(); // Remove targetField

  // Extract optional options
  var opts = deps[deps.length - 1];
  if (opts && typeof opts === "object") {
    deps.pop();
  }

  ctx.resolve(deps)
    .then(function(resolvedDeps) {
      var result = m.apply(instance, resolvedDeps.list);
      handleResult(result, opts, res, next);
    })
    .catch(function(err) {
      res.fail(err);
      next();
    });
};
