"use strict";

/**
 * The abstract base type for an injector.
 * @param deps {Array.<Dependency>|null|undefined} An optional list of dependencies to inject.
 * @constructor
 */
function Injector(deps) {
  this._deps = deps || [];
}

/**
 * Validate an Injector sub-type for mandatory meta-data.
 * @param Type {Injector} The injector type to validate.
 * @throws Error if the injector type is invalid.
 */
Injector.validateType = function(Type) {

  // Sub-type validation
  var validation = {
    injectorName: 'string',
    createsInstance: 'boolean',
    allowsMultiples: 'boolean'
  };

  Object.keys(validation).forEach(function(name) {
    var expectedType = validation[name];
    if (typeof Type[name] !== expectedType) {
      throw new Error("Injector type must define boolean property: " + name);
    }
  });

};

/** @lends Injector# */
var I = Injector.prototype;

/**
 * Get a list of dependencies to be injected.
 * @return {Array.<Dependency>} The list of dependencies this injector will inject.
 */
I.deps = function() {
  return this._deps;
};

/**
 * Get the type name of this injector.
 * @return {String} The injector type name.
 */
I.injectorName = function() {
  return this.constructor.injectorName;
};

/**
 * Determine if this injector will create new component instances.
 * @return {boolean}
 */
I.createsInstance = function() {
  return this.constructor.createsInstance;
};

/**
 * Determine if this injector type can be associated in multiple for a single component resolution.
 * @return {boolean}
 */
I.allowsMultiples = function() {
  return this.constructor.allowsMultiples;
};

/**
 * @param component {*} The component being resolved.
 * @param deps {{list: [], map: {}} A structure containing resolved dependencies to inject.
 * @return {*} Optionally, the instance that will be the result of the component resolution.
 * @abstract
 */
I.inject = function(component, deps) {
  throw new Error("Sub-types of Injector must override the 'inject' method");
};

I.toString = function() {
  return this.constructor.name +
      "{name: " + this.injectorName() +
      ", createsInstance: " + this.createsInstance() +
      ", allowsMultiples: " + this.allowsMultiples() +
      "}";
};

module.exports = Injector;
