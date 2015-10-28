"use strict";
var util = require('util');
var Injector = require('../Injector');

function ConstructorInjector(deps) {
  Injector.call(this, "constructor", deps, true, false);
}
util.inherits(ConstructorInjector, Injector);

var CI = ConstructorInjector.prototype;

CI.inject = function(Type, resolvedDeps) {
  var t = Object.create(Type.prototype);
  Type.apply(t, resolvedDeps);
  return t;
};

module.exports = ConstructorInjector;
