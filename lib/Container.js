"use strict";

var assert = require('./util').assert;
var Component = require('./Component');
var RegistrationBuilder = require('./RegistrationBuilder');
var ResolutionError = require('./ResolutionError');
var Resolver = require('./Resolver');

var nullContainer = {
  resolve: function(key, options) {
    if (options && options.optional) {
      return Promise.resolve(null);
    }
    throw new ResolutionError("Not found: " + key);
  },
  keys: function() {
    return [];
  }
};

/**
 * <strong>Private constructor</strong>. Instances are normally created with these methods:
 * <ul>
 *   <li>{@link junkie.newContainer}</li>
 *   <li>{@link Container#newChild}</li>
 * </ul>
 *
 * @param {Container|undefined} parent  The optional parent container.
 * @param {Array.<Resolver>|undefined} resolvers  The optional list of resolvers.
 *
 * @constructor
 */
function Container(parent, resolvers) {
  this._parent = parent || nullContainer;
  this._registry = {};
  this._containerResolvers = resolvers ? resolvers.slice() : [];
}

/** @lends Container# */
var C = Container.prototype;

/**
 * Obtain the parent container, or <code>null</code> if this container is an orphan.
 * @returns {Container|null} The parent container or <code>null</code>
 */
C.parent = function() {
  return this._parent === nullContainer
    ? null
    : this._parent;
};

/**
 * Create a new child Container.
 *
 * @param {object} options Optional configuration options
 * @param {boolean} [options.inherit=true] When <code>true</code>, the new child container inherits this container's
 *        resolvers.
 */
C.newChild = function(options) {
  this._checkDisposed();

  options = options || {};

  var resolvers = this._containerResolvers;
  if (options.inherit === false) {
    resolvers = null;
  }

  return new Container(this, resolvers);
};

/**
 * Use the given resolver middleware.
 * @param {String|Function} resolver The resolver to use. Supplying a String attempts to locate a standard resolver
 *        by name. Supplying a Function uses the Function itself as the resolver implementation.
 * @returns {Container} <code>this</code>.
 * @see Resolver
 */
C.use = function(resolver) {
  this._checkDisposed();

  resolver = Resolver.normalize(resolver);
  this._containerResolvers.push(resolver);
  return this;
};

/**
 * Dispose of this container, releasing all references to components. Using any modifying method after this
 * call will throw an Error. Resolve requests will be delegated to the parent container, if available.
 */
C.dispose = function() {
  delete this._registry; // Drop references to all components
};

C._checkDisposed = function() {
  if (!this._registry) {
    throw new Error("Container disposed");
  }
};

/**
 * Register the given component with this Container, making it directly resolvable using the
 * {@link Container#resolve} method, as well as making it available for resolution and as a
 * potential dependency of another component.
 *
 * @param {String} key The key associated with the component.
 * @param {*} component The component instance that will be tracked by this container.
 * @returns {RegistrationBuilder} A registration builder to configure the registration.
 *
 * @throws Error if key is not a string
 * @throws Error if component is not defined or <code>null</code>.
 */
C.register = function(key, component) {
  this._checkDisposed();

  assert.type(key, 'string', "key must be a string");
  assert(component !== undefined, "component must be defined");

  var comp = this._createComponent(key, component);
  this._registry[key] = comp;

  return new RegistrationBuilder(comp);
};

C._createComponent = function(key, component) {
  return new Component(key, component, this, this._containerResolvers);
};

C._get = function(key) {
  assert.type(key, 'string', "key must be a string");
  return this._registry
    ? this._registry[key]
    : null; // If the container was disposed, behave like a 'not found' so we continue searching the parent
};

/**
 * Resolve an instance for the given component key. To resolve an instance, every associated resolver is passed
 * control and given the opportunity to create and configure the resulting component instance.
 * <p>
 * When resolving dependencies of the requested component, this same method is invoked internally for each
 * dependency.
 *
 * @param {string} key The component key with which to obtain an instance.
 * @param {Object} [options] Configuration options.
 * @param {boolean} [options.optional=false] When <code>true</code>, in the event that the component cannot be resolved
 *        return <code>null</code> instead of throwing a ResolutionError.
 * @returns {Promise} A promise capturing the result of the resolution. The promise will be rejected with:
 *          - Error if key is not a string.
 *          - ResolutionError if the mandatory key cannot be located.
 *          - ResolutionError if a failure occurs during the resolution process.
 */
C.resolve = function(key, options) {
  try {
    options = options || {};

    // Lookup the component
    var comp = this._get(key);

    // If the component is not found, delegate to the parent container
    if (!comp) {
      return this._parent.resolve(key, options);
    }

    // Resolve the component instance
    return comp.resolve(options);

  } catch (e) {
    return Promise.reject(e);
  }
};

/**
 * Obtain an array of key names known to this container and, optionally, parent containers.
 *
 * @param {boolean} [includeParent=false] Include keys registered with the parent container, if any.
 * @returns {Array} A set of key names.
 */
C.keys = function(includeParent) {
  var keys = {};
  var addKey = function(key) {
    keys[key] = true;
  };
  if (includeParent) {
    this._parent.keys().forEach(addKey);
  }
  Object.keys(this._registry).forEach(addKey);

  return Object.keys(keys);
};

module.exports = Container;
