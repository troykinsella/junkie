"use strict";

var fs = require('fs');
var path = require('path');

var InjectorFactory = require('./InjectorFactory');

var Dependency = require('./Dependency');

// Generate standard resolver names
var resolverDir = path.resolve(__dirname, 'resolver');
var standardResolverNames = fs.readdirSync(resolverDir).map(function(moduleName) {
  return moduleName.split('.')[0];
});

function getCreatorInjectorNames() {
  var creatorInjectorNames =
    InjectorFactory
      .injectors()
      .filter(function(Injector) { return Injector.createsInstance; })
      .map(function(Injector) { return Injector.injectorName });
  return creatorInjectorNames;
}

function RegistrationBuilder(comp, descriptor) {
  this._comp = comp;
  this._descriptor = descriptor;

  // Evaluate this for every new RegistrationBuilder instance, as opposed to once, so that we can pick up
  // newly-registered custom injectors.
  this._creatorInjectorNames = getCreatorInjectorNames();

  this.inject.optional = this.inject.optional.bind(this);

  this._initInterface();
}

var RB = RegistrationBuilder.prototype;

RB._initInterface = function() {
  var useGetter = this._createUseGetter();

  [ 'use', 'with', 'as' ]
    .forEach(function(alias) {
      Object.defineProperty(this, alias, {
        get: useGetter
      });
    }.bind(this));
};

RB._use = function(resolver) {
  // Handle special case: instance-creating injector aliases with no injected deps
  if (this._creatorInjectorNames.indexOf(resolver) > -1) {
    var args = Array.prototype.slice.apply(arguments);
    args.splice(1, 0, []); // insert empty dependencies array as second argument
    this._addInjector.apply(this, args);
    resolver = "injector";
  }

  this._comp.use(resolver);
  return this;
};

RB._createUseGetter = function() {
  var use = function() {
    return this._use.apply(this, arguments);
  }.bind(this);

  var resolverNames = standardResolverNames.concat(this._creatorInjectorNames);

  resolverNames.forEach(function(resolver) {
    use[resolver] = use.bind(this, resolver);
  }.bind(this));

  return function() { // Getter function
    return use; // Getter result
  };
};

RB._ensureInjectorResolver = function() {
  if (!this._addedInjectorResolver) {
    this._addedInjectorResolver = true;
    this._use("injector");
  }
};

RB._addInjector = function() {
  var args = Array.prototype.slice.apply(arguments);
  var injector = InjectorFactory.create.apply(InjectorFactory, args);
  this._descriptor.addInjector(injector);
};

RB.inject = function() {
  var deps = Array.prototype.slice.apply(arguments);
  return this._inject(deps, {});
};

RB.inject.optional = function() {
  var deps = Array.prototype.slice.apply(arguments);
  return this._inject(deps, { optional: true });
};

RB._inject = function(deps, options) {
  this._ensureInjectorResolver();

  deps = deps.map(function(dep) {
    return new Dependency(dep, options.optional);
  });

  var into = this._addInjector;

  InjectorFactory
    .names()
    .forEach(function(name) {
      into[name] = function() {
        var args = Array.prototype.slice.apply(arguments);
        args.unshift(deps); // Add the deps to the font
        args.unshift(name); // Add the injector name to the front
        into.apply(this, args);
        return this;
      }.bind(this);
    }.bind(this));

  return {
    into: into
  };
};

module.exports = RegistrationBuilder;
