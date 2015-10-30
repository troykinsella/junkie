"use strict";

var assert = require('assert');
var Component = require('./Component');
var Descriptor = require('./Descriptor');
var RegistrationBuilder = require('./RegistrationBuilder');
var ResolutionError = require('./ResolutionError');
var Resolver = require('./Resolver');

var nullContainer = {
  resolve: function(key, options) {
    if (options && options.optional) {
      return null;
    }
    throw new ResolutionError("Not found: " + key);
  }
};

function Container(parent, resolvers) {
  this._parent = parent || nullContainer;
  this._registry = {};
  this._containerResolvers = resolvers ? resolvers.slice() : [];
  this._disposed = false;
}

var C = Container.prototype;

C.parent = function() {
  return this._parent;
};

C.newChild = function(options) {
  this._checkDisposed();

  options = options || {};

  var resolvers = this._containerResolvers;
  if (options.inherit === false) {
    resolvers = null;
  }

  var child = new Container(this, resolvers);

  return child;
};

C.use = function(resolver) {
  this._checkDisposed();

  resolver = Resolver.normalize(resolver);
  this._containerResolvers.unshift(resolver);
  return this;
};

C.dispose = function() {
  delete this._registry; // Drop references to all components
};

C._checkDisposed = function() {
  if (!this._registry) {
    throw new Error("Container disposed");
  }
};

C.register = function(key, instance, descriptor) {
  this._checkDisposed();

  assert(typeof key === 'string', "key must be a string");
  assert(!!instance, "instance must be defined");

  descriptor = new Descriptor(descriptor || instance.$inject || []);

  var comp = this._createComponent(key, instance, descriptor);
  this._registry[key] = comp;

  return new RegistrationBuilder(comp, descriptor);
};

C._createComponent = function(key, instance, descriptor) {
  var comp = new Component(key, instance, descriptor, this);
  this._containerResolvers.forEach(comp.use.bind(comp));
  return comp;
};

C._get = function(key) {
  assert(typeof key === 'string', "key must be a string");
  if (!this._registry) {
    // If the container was disposed, behave like a 'not found' so we continue searching the parent
    return null;
  }
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

  // Lookup the component
  var comp = this._get(key);

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

  var instance = resolution.instance();

  return instance;
};

module.exports = Container;
