"use strict";

var assert = require('assert');
var util = require('./util');
var Component = require('./Component');
var Descriptor = require('./Descriptor');
var RegistrationBuilder = require('./RegistrationBuilder');
var ResolutionError = require('./ResolutionError');

var nullContainer = {
  resolve: function(key, options) {
    if (options && options.optional) {
      return null;
    }
    throw new ResolutionError("Not found: " + key);
  }
};

function Container(parent) {
  this._parent = parent || nullContainer;
  this._registry = {};
  this._defaultResolvers = [];
}

var C = Container.prototype;

C.parent = function() {
  return this._parent;
};

C.child = function() {

  var child = new Container(this);




  return child;
};

C.use = function(resolver) {
  resolver = util.normalizeResolver(resolver);
  this._defaultResolvers.push(resolver);
  return this;
};

C.dispose = function() {

};

C.register = function(key, instance, descriptor) {
  assert(typeof key === 'string', "key must be a string");
  assert(!!instance, "instance must be defined");

  descriptor = new Descriptor(descriptor || instance.$inject || []);

  var comp = new Component(key, instance, descriptor, this);
  this._registry[key] = comp;
  //this._defaultResolvers.forEach(use);

  return new RegistrationBuilder(comp, descriptor);
};

C._get = function(key) {
  assert(typeof key === 'string', "key must be a string");
  return this._registry[key];
};

/**
 *
 * @param key {string}
 * @param options {object|undefined}
 * @return {*}
 */
C.resolve = function(key, options) {
  options = options || {};

  //console.log("Container#resolve", options);

  // Lookup the component
  var comp = this._get(key);
  //console.log("Container#resolve", key, comp);

  // If the component is not found, delegate to the parent container
  if (!comp) {
    return this._parent.resolve(key, options);
  }

  // Resolve the component instance
  var resolution = comp.resolve(options);
  if (!resolution) {
    throw new Error("resolvers must call next() synchronously");
  }

  // If any resolver failed, bail now
  var err = resolution.error();
  if (err) {
    throw  err;
  }

  // If the .. uh
  /*if (!resolution.instance() && this._parent) {
    return this._parent.resolve(key, options);
  }*/

  //console.log("Container#resolve result", resolution.instance());

  var instance = resolution.instance();


  return instance;
};

module.exports = Container;
