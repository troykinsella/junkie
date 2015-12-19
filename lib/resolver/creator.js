"use strict";
var assert = require('../util').assert;
var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance using a call to <code>Object.create</code>
 * passing the component as the prototype. An optional argument is accepted
 * which is the <code>properties</code> argument to <code>Object.create</code>.
 * The argument can either be the properties object, or a string dependency key
 * pointing to the properties object.
 *
 * @function
 * @exports Resolver:creator
 * @throws ResolutionError
 */
module.exports = function creator(ctx, res, next, async) {
  res.instance(false);

  var comp = ctx.component();
  assert.type(comp,
    'object',
    'creator resolver component must be an object',
    ResolutionError);

  var props = this.args()[0];

  function result(resolvedProps) {
    if (resolvedProps) {
      assert.type(resolvedProps,
        'object',
        "create properties must be an object",
        ResolutionError);
    }
    var instance = Object.create(comp, resolvedProps);
    res.resolve(instance);
    next();
  }

  if (typeof props === 'string') {
    if (async) {
      ctx.resolved(props)
        .then(result)
        .catch(res.fail);
    } else {
      result(ctx.resolve(props));
    }
  } else {
    result(props);
  }
};
