"use strict";
var util = require('util');
var Injector = require('../Injector');

function ConstructorInjector(deps) {
  Injector.call(this, "constructor", deps, true, false);

  //console.log("new ConstructorInjector", deps);
}
util.inherits(ConstructorInjector, Injector);

var CI = ConstructorInjector.prototype;

CI.inject = function(Type, resolvedDeps) {
  //console.log("ConstructorInjector#inject", Type, resolvedDeps);
  //var inst = new (Function.prototype.bind.apply(Type, resolvedDeps));
  var t = Object.create(Type.prototype);
  Type.apply(t, resolvedDeps);

  //console.log("ConstructorInjector#inject1", t);
  return t;
};

module.exports = ConstructorInjector;
