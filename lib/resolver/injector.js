"use strict";

var Injector = require('../Injector');
var ResolutionError = require('../ResolutionError');

function resolveInjectorArg(resolver) {
  var injector = resolver.arg(0,
    "injector resolver requires argument of injector instance");

  if (!(injector instanceof Injector)) {
    throw new ResolutionError("injector must be of type Injector");
  }

  return injector;
}

/**
 * If an instance-creating injector is associated with the component, it is invoked and the resulting instance
 * is resolved. The next resolvers are then executed, and after they complete, any remaining injectors are
 * given the opportunity to inject into the resolved instance.
 *
 * @function
 * @exports Resolver:injector
 */
module.exports = function injector(ctx, res, next) {

  var injector = resolveInjectorArg(this);
  var deps = ctx.resolve(injector.deps());

  if (injector.createsInstance()) {
    if (res.instance()) {
      throw new ResolutionError();
    }

    var inst = injector.inject(ctx.component(), deps);
    if (!inst) {
      throw new ResolutionError("Injector did not return an instance: " + injector.name());
    }

    res.resolve(inst);
  }

  next();

  if (!injector.createsInstance()) {
    injector.inject(res.instanceOrComponent(), deps);
  }
};
