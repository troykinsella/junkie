"use strict";

function ResolutionContext(options) {
  this._previous = options.previous;
  this._container = options.container;
  this._key = options.key;
  this._component = options.component;
  this._descriptor = options.descriptor;
  this._store = options.store;
}

var RC = ResolutionContext.prototype;

RC.previous = function() {
  return this._previous;
};

RC.key = function() {
  return this._key;
};

RC.component = function() {
  return this._component;
};

RC.store = function(key, value) {
  if (key === undefined) {
    return this._store;
  } else if (value === undefined) {
    return this._store[key];
  } else {
    this._store[key] = value;
  }
};

RC.resolve = function(deps) {
  var asArray = true;
  if (!Array.isArray(deps)) {
    deps = [ deps ];
    asArray = false;
  }

  deps = deps.map(function(dep) {
    return this._container.resolve(dep, {
      resolutionContext: this
    });
  }.bind(this));

  if (asArray) {
    return deps;
  }
  return deps[0];
};

RC.phase = function(phase) {
  if (phase === undefined) {
    return this._phase;
  }
  this._phase = phase;
};

RC.createorInjector = function() {
  var injectors =
    this._descriptor
      .injectors()
      .filter(function(injector) {
        return injector.createsInstance();
      });

  if (injectors.length > 1) {
    throw new Error("Multiple creator injectors");
  }

  return injectors[0];
};

RC.configurationInjectors = function() {
  return this._descriptor
    .injectors()
    .filter(function(injector) {
      return !injector.createsInstance();
    });
};

RC.injectors = function(name) {
  return this._descriptor.injectors(name);
};

RC.deps = function() {
  return this._descriptor.deps();
};


module.exports = ResolutionContext;
