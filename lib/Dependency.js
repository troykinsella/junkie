"use strict";
var assert = require('./util').assert;

/**
 * Instances are created internally during component registration.
 *
 * @param {String} key The component key.
 * @param {boolean} optional <code>true</code> when the dependency is optional.
 * @constructor
 * @classdesc Private to junkie internals.
 */
function Dependency(key, optional) {
  assert(key, "key must be defined");

  this._key = key;
  this._optional = optional;
}

/** @lends Dependency# */
var D = Dependency.prototype;

/**
 * The key of the dependent component.
 * @returns {String} The dependency key.
 */
D.key = function() {
  return this._key;
};

/**
 * Determine if the dependency is optional.
 * @returns {boolean} <code>true</code> for an optional dependency.
 */
D.optional = function() {
  return this._optional;
};

/**
 *
 * @param {String|Dependency} key
 * @returns {Dependency}
 */
Dependency.getOrCreate = function(keyOrDep, options) {
  if (keyOrDep instanceof Dependency) {
    return keyOrDep;
  }

  var optional = false;

  if (options && typeof options.optional === 'boolean') {
    optional = options.optional;
  }

  // Parse optional from key suffix
  var key = keyOrDep;
  if (key[key.length - 1] === '?') {
    key = key.substring(0, key.length - 1);
    optional = true;
  }

  return new Dependency(key, optional);
};

module.exports = Dependency;

