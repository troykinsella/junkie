"use strict";
var util = require('util');
var Injector = require('../Injector');
var ResolutionError = require('../ResolutionError');

function MethodInjector(deps, targetMethod) {
  Injector.call(this, "method", deps, false, true);
  this._targetMethod = targetMethod;
}
util.inherits(MethodInjector, Injector);

var CI = MethodInjector.prototype;

CI.inject = function(instance, resolvedDeps) {
  var m = instance[this._targetMethod];
  if (!m) {
    throw new ResolutionError("Method not found: " + this._targetMethod);
  }

  m.apply(instance, resolvedDeps);
  return instance;
};

module.exports = MethodInjector;
