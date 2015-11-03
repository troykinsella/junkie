"use strict";
function Injector(deps) {
  this._deps = deps || [];
}

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

var I = Injector.prototype;

I.deps = function() {
  return this._deps;
};

I.injectorName = function() {
  return this.constructor.injectorName;
};

I.createsInstance = function() {
  return this.constructor.createsInstance;
};

I.allowsMultiples = function() {
  return this.constructor.allowsMultiples;
};

module.exports = Injector;
