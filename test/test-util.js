"use strict";

function createType() {
  var f = function() {
    this._args = Array.prototype.slice.apply(arguments);
  };

  f.prototype.set = function() {
    this._set = Array.prototype.slice.apply(arguments);
  };

  return f;
}

function createFactory(Type) {
  return function() {
    var args = Array.prototype.slice.apply(arguments);
    var t = Object.create(Type.prototype);
    Type.apply(t, args);
    return t;
  };
}

module.exports = {
  createType: createType,
  createFactory: createFactory
};
