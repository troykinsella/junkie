"use strict";
var Dependency = require('./Dependency');

/**
 * @param entries
 * @constructor
 * @classdesc Private to junkie internals.
 */
function Descriptor(entries) {

  this._injectors = [];
  this._deps = {};

  if (entries) {
    this.addDeps(entries);
  }
}

var D = Descriptor.prototype;





D.addDep = function(dep) {
  dep = Dependency.getOrCreate(dep);
  this._deps[dep.key()] = dep;
};


D.addInjector = function(injector) {
  this._injectors.push(injector);
  this.addDeps(injector.deps());
};

D.addDeps = function(entries) {
  if (!Array.isArray(entries)) {
    throw new Error("descriptor entries must be an array");
  }

  entries.forEach(function(entry) {
    this.addDep(entry);
  }.bind(this));
};

D.injectors = function(name) {
  if (name) {
    return this._injectors.filter(function(injector) {
      return injector.name() === name;
    });
  } else {
    return this._injectors.slice();
  }
};

D.deps = function() {
  return this._deps.slice();
};


module.exports = Descriptor;

