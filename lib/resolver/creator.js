"use strict";
var assert = require('../util').assert;
var ResolutionError = require('../ResolutionError');

function resolveProperties(res, ctx) {
  var props = res.args()[0];
  if (props) {
    if (typeof props === 'string') {
      props = ctx.resolve(props);
    }
    assert.type(props,
      'object',
      "create properties must be an object",
      ResolutionError);
  }
  return props;
}

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
module.exports = function creator(ctx, res) {
  res.instance(false);
  assert.type(ctx.component(),
    'object',
    'creator resolver component must be an object',
    ResolutionError);

  var properties = resolveProperties(this, ctx);
  var instance = Object.create(ctx.component(), properties);
  res.resolve(instance);
};
