"use strict";

var InjectorFactory = require('./InjectorFactory');

var Dependency = require('./Dependency');

function RegistrationBuilder(comp, descriptor) {
  this._comp = comp;
  this._descriptor = descriptor;

  RB.inject.optional = RB.inject.optional.bind(this);

  // TODO: move to prototype
  [ 'with', 'as' ]
    .forEach(function(alias) {
      this._wireGetter(alias, this._getUse);
    }.bind(this));

  // TODO: this is lame
  var createStandardInjector = function(name) {
    return function() {
      this._addInjector(name, []);
      return require('./resolver/injector');
    }.bind(this);
  }.bind(this);

  // TODO: scan filesystem and generate
  this._standardResolvers = {
    caching: function() {
      return require('./resolver/caching');
    },
    constructor: createStandardInjector('constructor'),
    factory: createStandardInjector('factory'),
    injector: createStandardInjector('injector')
  };

}

var RB = RegistrationBuilder.prototype;

RB._wireGetter = function(name, fn) {
  return Object.defineProperty(this, name, {
    get: fn
  });
};

RB.use = function(resolver) {
  this._comp.use(resolver);
  return this;
};

RB._getUse = function() {
  var use = function() {
    return this.use.apply(this, arguments);
  }.bind(this);

  var fns = this._standardResolvers;
  Object.keys(fns).forEach(function(resolverName) {
    use[resolverName] = function() {
      use(fns[resolverName]());
      return this;
    }.bind(this);
  }.bind(this));

  return use;
};

RB._ensureInjectorResolver = function() {
  if (!this._addedInjectorResolver) {
    this._addedInjectorResolver = true;
    this.use("injector");
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

  var into = this._addInjector.bind(this);

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
