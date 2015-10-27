
const ConstructorInjector = require('../injector/ConstructorInjector');

module.exports = function injectorResolver(res, next) {

  var phase = this.phase();

  if (phase === 'instantiate') {
    var injector = this.createorInjector();
    if (!injector) {
      injector = new ConstructorInjector();
    }

    if (injector) {
      var Type = this.component();
      var deps = injector.deps()
        .map(function(dep) {
          return this.resolve(dep);
        }.bind(this));

      var inst = injector.inject(Type, deps);
      res.resolve(inst);
    }

  } else if (phase === 'configure') {
    this.configurationInjectors()
      .forEach(function(injector) {
        injector.inject(res.instance());
      });
  }
  next();
};
