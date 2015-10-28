"use strict";

var InjectorFactory = require('./InjectorFactory');

var Dependency = require('./Dependency');

function RegistrationBuilder(comp, descriptor) {
  this._comp = comp;
  this._descriptor = descriptor;

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
  //console.log("USING: ", resolver);
  this._comp.use(resolver);
  return this;
};

RB._getUse = function() {
  //console.log("GET USE");
  var use = function() {
    //console.log("USE");
    return this.use.apply(this, arguments);
  }.bind(this);

  var fns = this._standardResolvers;
  Object.keys(fns).forEach(function(resolverName) {
    //console.log("USING1", resolverName);
    use[resolverName] = function() {
      //console.log("USING2", resolverName);
      use(fns[resolverName]());
      return this;
    }.bind(this);
  }.bind(this));

  //console.log("RegistrationBuilder#_getUse", fns);

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
  //console.log("RegistrationBuilder#inject", deps);

  this._ensureInjectorResolver();

  deps.map(function(dep) {
    return Dependency.parse(dep);
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
      };
    }.bind(this));

  return {
    into: into
  };
};


module.exports = RegistrationBuilder;
