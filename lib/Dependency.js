"use strict";
var assert = require('assert');

function Dependency(key, optional) {
  assert(key, "key must be defined");

  this._key = key;
  this._optional = optional;
}

var D = Dependency.prototype;

D.key = function() {
  return this._key;
};

D.optional = function() {
  return this._optional;
};

Dependency.parse = function(key) {
  var optional = false;

  // Parse optional
  if (key[key.length - 1] === '?') {
    key = key.substring(0, key.length - 1);
    optional = true;
  }

  return new Dependency(key, optional);
};

module.exports = Dependency;

