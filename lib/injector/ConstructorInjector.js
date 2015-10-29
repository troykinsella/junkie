"use strict";
var util = require('util');
var Injector = require('../Injector');
var ResolutionError = require('../ResolutionError');

function ConstructorInjector(deps) {
  Injector.call(this, "constructor", deps, true, false);
}
util.inherits(ConstructorInjector, Injector);

var CI = ConstructorInjector.prototype;

CI.inject = function(Type, resolvedDeps) {
  if (typeof Type !== 'function') {
    throw new ResolutionError("Constructor injector: Component must be a function: " + (typeof Type));
  }

  var instance = Object.create(Type.prototype);
  Type.apply(instance, resolvedDeps);
  return instance;
};

module.exports = ConstructorInjector;
