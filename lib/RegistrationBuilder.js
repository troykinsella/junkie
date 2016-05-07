"use strict";

var Resolver = require('./Resolver');

/**
 * <strong>Private constructor</strong>. Instances are normally created internally and returned from calls to
 * {@link Container#register}.
 *
 * The methods available are documented as Resolver modules. Several resolver methods can be chained by
 * supplying one of the following properties for readability:
 *
 * <ul>
 *   <li>and</li>
 *   <li>as</li>
 *   <li>use</li>
 *   <li>with</li>
 * </ul>
 *
 * @example
 * container.register("A", A)
 *   .with.constructor()
 *   .and.method("setB", "B");
 *
 * @param comp {*}
 * @constructor
 */
function RegistrationBuilder(comp) {
  this._comp = comp;

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
};

RB._use = function(resolver) {
  var args = Array.prototype.slice.apply(arguments);
  args.shift(); // remove resolver

  this._comp.use(resolver, args);
  return this;
};

RB._createUseGetter = function() {
  var use = this._use.bind(this); // Copy
  var resolverNames = Object.keys(Resolver.StandardResolvers);

  resolverNames.forEach(function(resolver) {
    use[resolver] = use.bind(this, resolver);
  }.bind(this));

  return function() { // Getter function
    return use; // Getter result
  };
};


module.exports = RegistrationBuilder;
