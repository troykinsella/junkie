"use strict";
function Injector(name, deps, createsInstance, allowMultiples) {
  //console.log("Injector: ", arguments);
  this._name = name;
  this._deps = deps || [];
  this._createsInstance = createsInstance;
  this._allowMultiples = allowMultiples;
}


var I = Injector.prototype;

I.name = function() {
  return this._name;
};

I.createsInstance = function() {
  return this._createsInstance;
};

I.allowMultiples = function() {
  return this._allowMultiples;
};

I.deps = function() {
  return this._deps;
};

module.exports = Injector;
