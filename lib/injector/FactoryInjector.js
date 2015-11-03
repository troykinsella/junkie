"use strict";
var util = require('util');
var Injector = require('../Injector');
var ResolutionError = require('../ResolutionError');

function FactoryInjector(deps) {
  Injector.call(this, deps);
}
util.inherits(FactoryInjector, Injector);

FactoryInjector.injectorName = "factory";
FactoryInjector.createsInstance = true;
FactoryInjector.allowsMultiples = false;

var CI = FactoryInjector.prototype;

CI.inject = function(factory, resolvedDeps) {
  if (typeof factory !== 'function') {
    throw new ResolutionError("Factory injector: Component must be a function: " + (typeof factory));
  }

  var instance = factory.apply(factory, resolvedDeps);
  return instance;
};

module.exports = FactoryInjector;
