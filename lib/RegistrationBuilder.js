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

    // The injector addition will call _use again with the "injector" resolver, so abort this "use".
    return this;
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
  var injector = InjectorFactory.create.apply(null, args);
  this._use("injector", injector);

  this._descriptor.addInjector(injector);
  return this;
};

RB._inject = function(deps, options) {
  deps = deps.map(function(dep) {
    return Dependency.getOrCreate(dep, options);
  });

  var add = this._addInjector;

  InjectorFactory
    .names()
    .forEach(function(name) {
      add[name] = function() {
        var args = Array.prototype.slice.apply(arguments);
        args.unshift(deps); // Add the deps to the font
        args.unshift(name); // Add the injector name to the front
        add.apply(this, args);
        return this;
      }.bind(this);
    }.bind(this));

  return {
    // TODO: Allow further inject chaining for mixed optional/mandatory deps
    into: add
  };
};

module.exports = RegistrationBuilder;
