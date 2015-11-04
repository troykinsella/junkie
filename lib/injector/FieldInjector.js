"use strict";
var util = require('util');
var Injector = require('../Injector');
var ResolutionError = require('../ResolutionError');

/**
 * Injects a dependency into a component instance field.
 * @param deps {Array.<Dependency>|null|undefined} An optional list of dependencies to inject.
 * @param targetField {String} The name of the field into which a dependency will be injected.
 * @constructor
 * @extends Injector
 */
function FieldInjector(deps, targetField) {
  Injector.call(this, deps);
  this._targetField = targetField;
}
util.inherits(FieldInjector, Injector);

FieldInjector.injectorName = "field";
FieldInjector.createsInstance = false;
FieldInjector.allowsMultiples = true;

/** @lends FieldInjector# */
var CI = FieldInjector.prototype;

/**
 * Assigns a single dependency to the target field on the component instance.
 *
 * @param instance {Function} The component being resolved.
 * @param deps {{list: [], map: {}} A structure containing resolved dependencies to inject.
 * @throws ResolutionError when the number of dependencies is not <code>1</code>.
 */
CI.inject = function(instance, deps) {
  if (deps.list.length !== 1) {
    throw new ResolutionError("Field injector: Must inject exactly one dependency");
  }
  instance[this._targetField] = deps.list[0];
};

module.exports = FieldInjector;
