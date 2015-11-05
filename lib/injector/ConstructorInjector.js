"use strict";
var inherits = require('../util').inherits;
var Injector = require('../Injector');
var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance using a constructor.
 * @param deps {Array.<Dependency>|null|undefined} An optional list of dependencies to inject.
 * @constructor
 * @extends Injector
 */
function ConstructorInjector(deps) {
  Injector.call(this, deps);
}
inherits(ConstructorInjector, Injector);

ConstructorInjector.injectorName = "constructor";
ConstructorInjector.createsInstance = true;
ConstructorInjector.allowsMultiples = false;

/** @lends ConstructorInjector# */
var CI = ConstructorInjector.prototype;

/**
 * Calls <code>new</code> on the component, passing in the list of dependencies as arguments.
 * @param Type {Function} The component being resolved.
 * @param deps {{list: [], map: {}} A structure containing resolved dependencies to inject.
 * @return The instance that will be the result of the component resolution.
 */
CI.inject = function(Type, deps) {
  if (typeof Type !== 'function') {
    throw new ResolutionError("Constructor injector: Component must be a function: " + (typeof Type));
  }

  var instance = Object.create(Type.prototype);
  Type.apply(instance, deps.list);
  return instance;
};

module.exports = ConstructorInjector;
