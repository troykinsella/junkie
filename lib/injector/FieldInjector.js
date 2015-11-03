"use strict";
var util = require('util');
var Injector = require('../Injector');
var ResolutionError = require('../ResolutionError');

function FieldInjector(deps, targetField) {
  Injector.call(this, deps);
  this._targetField = targetField;
}
util.inherits(FieldInjector, Injector);

FieldInjector.injectorName = "field";
FieldInjector.createsInstance = false;
FieldInjector.allowsMultiples = true;

var CI = FieldInjector.prototype;

CI.inject = function(instance, resolvedDeps) {
  if (resolvedDeps.length !== 1) {
    throw new ResolutionError("Field injector: Must inject one and only one dependency");
  }
  instance[this._targetField] = resolvedDeps[0];
  return instance;
};

module.exports = FieldInjector;
