"use strict";
var util = require('util');
var Injector = require('../Injector');

function FieldInjector(deps, targetField) {
  Injector.call(this, "field", deps, false, true);
  this._targetField = targetField;
}
util.inherits(FieldInjector, Injector);

var CI = FieldInjector.prototype;

CI.inject = function(instance, resolvedDeps) {
  instance[this._targetField] = resolvedDeps[0];
  return instance;
};

module.exports = FieldInjector;
