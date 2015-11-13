"use strict";

var ResolutionError = require('../ResolutionError');

function resolveDecoratorArg(resolver, ctx) {
  var decorator = resolver.arg(0,
    "decorator resolver requires argument of string dependency key or factory function");

  if (typeof decorator === 'string') {
    decorator = ctx.resolve(decorator);
  }
  if (typeof decorator !== 'function') {
    throw new ResolutionError("decorator must be a factory function");
  }

  return decorator;
}

/**
 * Wraps the previously resolved instance or the component with a decorator by calling a decorator factory function.
 *
 * A decorator resolver requires a second argument to the {@link Container#use} or {@link RegistrationBuilder#use}
 * call with which it is being used. This argument specifies the decorator factory and is either:
 * <ul>
 *   <li>A <code>String</code> key of the decorator factory to resolve</li>
 *   <li>A <code>Function</code> that is the decorator factory</li>
 * </ul>
 *
 * @function
 * @exports Resolver:decorator
 */
module.exports = function decorator(ctx, res, next) {
  var decoratorFactory = resolveDecoratorArg(this, ctx);

  next();

  var decorated = decoratorFactory(res.instance() || ctx.component());
  if (decorated === undefined || decorated === null) {
    throw new ResolutionError('decorator factory did not return instance when resolving: ' + ctx.key());
  }

  res.resolve(decorated);
};
