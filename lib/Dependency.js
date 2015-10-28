"use strict";
var assert = require('assert');

function Dependency(key, target, optional) {
  assert(key, "key must be defined");

  this._key = key;
  this._target = target;
  this._optional = optional;
}

var D = Dependency.prototype;

D.key = function() {
  return this._key;
};

D.target = function() {
  return this._target;
};


D.optional = function() {
  return this._optional;
};

Dependency.forString = function(str) {

  var key = null;
  var target = null;
  var optional = false;

  // Parse optional
  if (str[str.length - 1] === '?') {
    str = str.substring(0, str.length - 1);
    optional = true;
  }

  // Parse target
  var parts = str.split(':');
  if (parts.length > 1) {
    str = parts[0];
    target = parts[1];
  }

  key = str;

  return new Dependency(key, target, optional);
};

Dependency.parse = function(entry) {
  if (typeof entry === 'string') {
    return Dependency.forString(entry);
  }

  var key = null;
  var target = null;
  var optional = false;

  if (entry.type) {
    key = entry.type;
    target = entry.target;
    optional = !!entry.optional;
  } else {
    key = entry;
    optional = false;
  }

  return new Dependency(key, target, optional);
};

module.exports = Dependency;

