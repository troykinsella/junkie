"use strict";

module.exports = function injectorResolver(ctx, res, next) {
  var creatorInjector = ctx.createorInjector();
  if (creatorInjector) {
    var Type = ctx.component();
    var deps = ctx.resolve(creatorInjector.deps());
    var inst = creatorInjector.inject(Type, deps);
    res.resolve(inst);
  }

  next();

  ctx.configurationInjectors()
    .forEach(function(injector) {
      var deps = ctx.resolve(injector.deps());
      injector.inject(res.instanceOrComponent(), deps);
    });
};
