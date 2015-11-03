"use strict";
var util = require('util');
var Injector = require('../Injector');
var ResolutionError = require('../ResolutionError');

function CreatorInjector(deps, targetInitializer) {
  Injector.call(this, deps);
  this._targetInitializer = targetInitializer;
}
util.inherits(CreatorInjector, Injector);

CreatorInjector.injectorName = "creator";
CreatorInjector.createsInstance = true;
CreatorInjector.allowsMultiples = false;

var CI = CreatorInjector.prototype;

CI.inject = function(Type, resolvedDeps) {
  var instance = Object.create(Type);

  if (this._targetInitializer) {
    var initializer = instance[this._targetInitializer];
    if (typeof initializer !== 'function') {
      throw new ResolutionError("Creator injector: Initializer function not found: " + this._targetInitializer);
    }
    initializer.apply(instance, resolvedDeps);

  } else {
    if (resolvedDeps.length > 0) {
      throw new ResolutionError("Creator injector: Initializer function not specified, but dependencies supplied");
    }
  }

  return instance;
};

module.exports = CreatorInjector;
