"use-strict";

const assert = require('assert');
const Component = require('./Component');
const Descriptor = require('./Descriptor');
const RegistrationBuilder = require('./RegistrationBuilder');

const nullContainer = {
  resolve: function(type) {
    var typeName = ((typeof type === 'string')
      ? type
      : type.constructor.name) ||
      "<unknown C>";
    throw new Error("Failed to resolve " + typeName);
  }
};

function Container(parent) {
  this._parent = parent || nullContainer;
  this._registry = {};
  this._defaultResolvers = [];
}

const C = Container.prototype;

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

  const comp = new Component(key, instance, descriptor, this);
  this._registry[key] = comp;
  //this._defaultResolvers.forEach(use);

  return new RegistrationBuilder(comp, descriptor);
};

C._get = function(key) {
  assert(typeof key === 'string', "key must be a string");
  return this._registry[key];
};

C.resolve = function(key) {
  // Lookup the component
  var comp = this._get(key);
  //console.log("Container#resolve", key, comp);

  // If the component is not found, delegate to the parent container
  if (!comp) {
    return this._parent.resolve(key);
  }

  // Resolve the component instance
  var resolution = comp.resolve();
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

  return resolution.instance();
};

module.exports = Container;
