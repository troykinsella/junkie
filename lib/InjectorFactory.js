"use strict";

var Injector = require('./Injector');

/**
 * Manages types of injectors available to junkie.
 *
 * @class
 * @static
 */
var InjectorFactory = {

  _map: {},

  /**
   * Create a new injector instance for the given injector type name.
   * @param name {String} The name of the injector to create.
   * @return {Injector} A new injector instance.
   * @throws Error when an injector type for the given name cannot be found.
   */
  create: function(name) {
    var args = Array.prototype.slice.apply(arguments);

    var Type = this._map[name];
    if (!Type) {
      throw new Error('Injector not found: ' + name);
    }

    var inst = new (Function.prototype.bind.apply(Type, args))();
    return inst;
  },

  /**
   * Obtain a list of injector names known to this factory.
   * @return {Array.<String>} Injector names.
   */
  names: function() {
    return Object.keys(this._map);
  },

  /**
   * Obtain a list of injector type objects known to this factory.
   * @return {Array.<Injector>} Injector type objects.
   */
  injectors: function() {
    return Object.keys(this._map).map(function(name) {
      return this._map[name];
    }.bind(this));
  },

  /**
   * Register an injector type with this factory, replacing any other for the given name that may have already existed.
   * @param Type {Injector} The injector type (constructor).
   */
  register: function(Type) {
    Injector.validateType(Type);
    this._map[Type.injectorName] = Type;
  }

};

// Register standard injectors
// (A loop would be nice, but browserify shits the bed)
var IF = InjectorFactory;
IF.register(require('./injector/ConstructorInjector'));
IF.register(require('./injector/CreatorInjector'));
IF.register(require('./injector/FactoryInjector'));
IF.register(require('./injector/FieldInjector'));
IF.register(require('./injector/MethodInjector'));

module.exports = InjectorFactory;
