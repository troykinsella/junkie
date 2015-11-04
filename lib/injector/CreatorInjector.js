"use strict";
var util = require('util');
var Injector = require('../Injector');
var ResolutionError = require('../ResolutionError');

/**
 * Creates a new component instance using a prototype object.
 * @param deps {Array.<Dependency>|null|undefined} An optional list of dependencies to inject.
 * @constructor
 * @extends Injector
 */
function CreatorInjector(deps, targetInitializer) {
  Injector.call(this, deps);
  this._targetInitializer = targetInitializer;
}
util.inherits(CreatorInjector, Injector);

CreatorInjector.injectorName = "creator";
CreatorInjector.createsInstance = true;
CreatorInjector.allowsMultiples = false;

/** @lends CreatorInjector# */
var CI = CreatorInjector.prototype;

/**
 * Calls <code>Object#create</code> on the component, treating it as a prototype, passing in the list of dependencies
 * as arguments.
 * @param proto {Object} The component being resolved.
 * @param deps {{list: [], map: {}} A structure containing resolved dependencies to inject.
 * @return The instance that will be the result of the component resolution.
 */
CI.inject = function(proto, deps) {
  var instance = Object.create(proto);

  if (this._targetInitializer) {
    var initializer = instance[this._targetInitializer];
    if (typeof initializer !== 'function') {
      throw new ResolutionError("Creator injector: Initializer function not found: " + this._targetInitializer);
    }
    initializer.apply(instance, deps.list);

  } else {
    if (deps.list.length > 0) {
      throw new ResolutionError("Creator injector: Initializer function not specified, but dependencies supplied");
    }
  }

  return instance;
};

module.exports = CreatorInjector;
