"use strict";

var InjectorFactory = require('./InjectorFactory');

var Dependency = require('./Dependency');
var Resolver = require('./Resolver');

/**
 * <strong>Private constructor</strong>. Instances are normally created internally and returned from calls to
 * {@link Container#register}.
 *
 * @param comp {*}
 * @param descriptor {Descriptor}
 * @constructor
 */
function RegistrationBuilder(comp, descriptor) {
  this._comp = comp;
  this._descriptor = descriptor;

  // Evaluate this for every new RegistrationBuilder instance, as opposed to once, so that we can pick up
  // newly-registered custom injectors.
  this._injectorNames = InjectorFactory.names();

  this._initInterface();
}

var RB = RegistrationBuilder.prototype;

RB._initInterface = function() {
  var useGetter = this._createUseGetter();

  [ 'use', 'with', 'as', 'and' ]
    .forEach(function(alias) {
      Object.defineProperty(this, alias, {
        get: useGetter
      });
    }.bind(this));

  // Define the 'inject' method at creation time because it is a pain in the ass to bind 'this'
  // to the nested inject.optional function when it lives on the prototype.
  this.inject = function() {
    var deps = Array.prototype.slice.apply(arguments);
    return this._inject(deps, {});
  }.bind(this);

  this.inject.optional = function() {
    var deps = Array.prototype.slice.apply(arguments);
    return this._inject(deps, { optional: true });
  }.bind(this);
};

RB._use = function(resolver) {
  var args = Array.prototype.slice.apply(arguments);

  // Handle special case: instance-creating injector aliases with no injected deps
  if (this._injectorNames.indexOf(resolver) > -1) {
    var injectorArgs = args.slice();
    injectorArgs.splice(1, 0, []); // insert empty dependencies array as second argument
    this._addInjector.apply(this, injectorArgs);
    resolver = "injector";
  }

  // Handle special case: ensure only one injector resolver
  if (resolver === "injector") {
    if (this._addedInjectorResolver) {
      return this; // Don't
    }
    this._addedInjectorResolver = true;
  }

  args.shift(); // remove resolver

  this._comp.use(resolver, args);
  return this;
};

RB._createUseGetter = function() {
  var use = this._use.bind(this); // Copy
  var resolverNames = Object.keys(Resolver.StandardResolvers).concat(this._injectorNames);

  resolverNames.forEach(function(resolver) {
    use[resolver] = use.bind(this, resolver);
  }.bind(this));

  return function() { // Getter function
    return use; // Getter result
  };
};

RB._addInjector = function() {
  var args = Array.prototype.slice.apply(arguments);
  var injector = InjectorFactory.create.apply(InjectorFactory, args);
  this._descriptor.addInjector(injector);
};

RB._inject = function(deps, options) {
  this._use("injector");

  deps = deps.map(function(dep) {
    return Dependency.getOrCreate(dep, options);
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
    // TODO: Allow further inject chaining for mixed optional/mandatory deps
    into: into
  };
};

module.exports = RegistrationBuilder;
