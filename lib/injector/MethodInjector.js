"use strict";
var util = require('util');
var Injector = require('../Injector');
var ResolutionError = require('../ResolutionError');

/**
 * Injects dependencies into a method of a component instance.
 * @param deps {Array.<Dependency>|null|undefined} An optional list of dependencies to inject.
 * @param targetMethod {String} The name of the method into which dependencies will be injected.
 * @constructor
 * @extends Injector
 */
function MethodInjector(deps, targetMethod) {
  Injector.call(this, deps);
  this._targetMethod = targetMethod;
}
util.inherits(MethodInjector, Injector);

MethodInjector.injectorName = "method";
MethodInjector.createsInstance = false;
MethodInjector.allowsMultiples = true;

/** @lends MethodInjector# */
var CI = MethodInjector.prototype;

/**
 * Passes dependencies as arguments to the target method on the component instance.
 *
 * @param instance {Function} The component being resolved.
 * @param deps {{list: [], map: {}} A structure containing resolved dependencies to inject.
 * @throws ResolutionError when the number of dependencies is not <code>1</code>.
 */
CI.inject = function(instance, deps) {
  var m = instance[this._targetMethod];
  if (typeof m !== 'function') {
    throw new ResolutionError("Method injector: Method not found: " + this._targetMethod);
  }

  m.apply(instance, deps.list);
};

module.exports = MethodInjector;
