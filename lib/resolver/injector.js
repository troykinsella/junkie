"use strict";

var ResolutionError = require('../ResolutionError');

/**
 * If an instance-creating injector is associated with the component, it is invoked and the resulting instance
 * is resolved. The next resolvers are then executed, and after they complete, any remaining injectors are
 * given the opportunity to inject into the resolved instance.
 *
 * @function
 * @exports Resolver:injector
 */
module.exports = function injector(ctx, res, next) {
  var creatorInjector = ctx.creatorInjector();
  if (creatorInjector) {
    var deps = ctx.resolve(creatorInjector.deps());
    var inst = creatorInjector.inject(ctx.component(), deps);
    if (!inst) {
      throw new ResolutionError("Injector did not return an instance: " + creatorInjector.name());
    }

    res.resolve(inst);
  }

  next();

  ctx.configurationInjectors()
    .forEach(function(injector) {
      var deps = ctx.resolve(injector.deps());
      injector.inject(res.instanceOrComponent(), deps);
    });
};
