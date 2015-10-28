"use strict";
var util = require('util');
var Injector = require('../Injector');

function FactoryInjector(deps) {
  Injector.call(this, "factory", deps, true, false);
}
util.inherits(FactoryInjector, Injector);

var CI = FactoryInjector.prototype;

CI.inject = function(factory, resolvedDeps) {
  var instance = factory.apply(factory, resolvedDeps);
  return instance;
};

module.exports = FactoryInjector;
