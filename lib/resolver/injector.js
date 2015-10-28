"use strict";

module.exports = function injectorResolver(res, next) {

  var phase = this.phase();

  if (phase === 'instantiate') {
    var injector = this.createorInjector();
    if (injector) {
      var Type = this.component();
      var deps = this.resolve(injector.deps());
      var inst = injector.inject(Type, deps);
      res.resolve(inst);

    } else {
      if (!res.instance()) {
        res.resolve(res.component());
      }
    }

  } else if (phase === 'configure') {
    this.configurationInjectors()
      .forEach(function(injector) {
        var deps = this.resolve(injector.deps());
        injector.inject(res.instance(), deps);
      }.bind(this));
  }

  next();
};
