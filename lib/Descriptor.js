"use strict";
var Dependency = require('./Dependency');

function Descriptor(entries) {

  this._injectors = [];
  this._deps = {};

  if (entries) {
    this.addDeps(entries);
  }
}

var D = Descriptor.prototype;





D.addDep = function(dep) {
  if (!(dep instanceof Dependency)) {
    dep = Dependency.parse(dep);
  }
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
    return this._injectors;
  }
};

D.deps = function() {
  return this._deps.slice();
};


D.toString = function() {
  return JSON.stringify(this, null, 2);

};

module.exports = Descriptor;

