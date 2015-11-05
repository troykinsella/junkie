"use strict";
var inherits = require('../util').inherits;
var Injector = require('../Injector');
var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance using a factory function.
 * @param deps {Array.<Dependency>|null|undefined} An optional list of dependencies to inject.
 * @constructor
 * @extends Injector
 */
function FactoryInjector(deps) {
  Injector.call(this, deps);
}
inherits(FactoryInjector, Injector);

FactoryInjector.injectorName = "factory";
FactoryInjector.createsInstance = true;
FactoryInjector.allowsMultiples = false;

/** @lends FactoryInjector# */
var CI = FactoryInjector.prototype;

/**
 * Calls the component function passing in the list of dependencies as arguments, and the returned result is
 * resolved as the component instance.
 *
 * @param factory {Function} The component being resolved.
 * @param deps {{list: [], map: {}} A structure containing resolved dependencies to inject.
 * @return The instance that the factory produced.
 */
CI.inject = function(factory, deps) {
  if (typeof factory !== 'function') {
    throw new ResolutionError("Factory injector: Component must be a function: " + (typeof factory));
  }

  var instance = factory.apply(factory, deps.list);
  return instance;
};

module.exports = FactoryInjector;
