!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.junkie=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var Resolver = _dereq_('./Resolver');
var Resolution = _dereq_('./Resolution');
var ResolutionContext = _dereq_('./ResolutionContext');
var ResolutionError = _dereq_('./ResolutionError');

/**
 * Captures a component registration with a {@link Container}.
 * Instances are created during {@link Container#register} calls.
 *
 * @param key {String}
 * @param instance {*}
 * @param descriptor {Descriptor}
 * @param container {Container}
 * @param containerResolvers {Array.<Resolver>|undefined}
 * @constructor
 * @classdesc Private to junkie internals.
 */
function Component(key, instance, descriptor, container, containerResolvers) {
  this._key = key;
  this._instance = instance;
  this._descriptor = descriptor;
  this._container = container;
  this._containerResolvers = containerResolvers || [];
  this._resolvers = [];
  this._store = {};
}

/** @lends Component# */
var C = Component.prototype;

/**
 * Obtain the component key.
 * @return {String}
 */
C.key = function() {
  return this._key;
};

/**
 * Obtain the user-provided component instance.
 * @return {*}
 */
C.instance = function() {
  return this._instance;
};

/**
 * Get the descriptor that manages injectors and dependencies for resolutions of this component.
 * @return {Descriptor}
 */
C.descriptor = function() {
  return this._descriptor;
};

/**
 * Obtain the data store for this component.
 * @return {Object}
 */
C.store = function() {
  return this._store;
};

/**
 * Use the given resolver middleware.
 * @param resolver {String|Function} The resolver to use. Supplying a String attempts to locate a standard resolver
 *        by name. Supplying a Function uses the Function itself as the resolver implementation.
 * @see Resolver
 * @return {Component} <code>this</code>.
 */
C.use = function(resolver, args) {
  resolver = Resolver.normalize(resolver, args);
  this._resolvers.unshift(resolver);
  return this;
};


C._createContext = function(options) {
  var ctx = new ResolutionContext({
    previous: options.resolutionContext,
    container: this._container,
    key: this.key(),
    component: this.instance(),
    descriptor: this.descriptor(),
    store: this.store()
  });

  this._checkCircularDeps(ctx);
  return ctx;
};

C._checkCircularDeps = function(ctx) {
  // Check for circular dependencies
  var seenKeys = {};

  do {
    var key = ctx.key();
    if (seenKeys[key]) {
      throw new ResolutionError("Circular dependency: " + key);
    }
    seenKeys[key] = true;
    ctx = ctx.previous();
  } while (ctx);
};

/**
 * Resolve an instance for this component.
 * @param options {Object} The optional resolution options.
 * @return {*|null}
 */
C.resolve = function(options) {
  options = options || {};

  var res = new Resolution(this.instance());
  var ctx = this._createContext(options);

  var i = 0;
  var resolvers = this._containerResolvers.concat(this._resolvers);

  var next = function() {
    var r = resolvers[i++];
    if (!r || res.error() || res.isDone()) {
      return;
    }

    r.resolve(ctx, res, next);
  }.bind(this);

  next();
  if (!res.instance()) {
    res.resolve(res.component());
  }

  return res;
};

module.exports = Component;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Component.js","/")
},{"./Resolution":8,"./ResolutionContext":9,"./ResolutionError":10,"./Resolver":11,"1YiZ5S":27,"buffer":23}],2:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var assert = _dereq_('assert');
var Component = _dereq_('./Component');
var Descriptor = _dereq_('./Descriptor');
var RegistrationBuilder = _dereq_('./RegistrationBuilder');
var ResolutionError = _dereq_('./ResolutionError');
var Resolver = _dereq_('./Resolver');

var nullContainer = {
  resolve: function(key, options) {
    if (options && options.optional) {
      return null;
    }
    throw new ResolutionError("Not found: " + key);
  }
};

/**
 * <strong>Private constructor</strong>. Instances are normally created with these methods:
 * <ul>
 *   <li>{@link junkie.newContainer}</li>
 *   <li>{@link Container#newChild}</li>
 * </ul>
 *
 * @param parent {Container|undefined} The optional parent container.
 * @param resolvers {Array.<Resolver>|undefined} The optional list of resolvers.
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
 * @return {Container|null} The parent container or <code>null</code>
 */
C.parent = function() {
  return this._parent === nullContainer ? null : this._parent;
};

/**
 * Create a new child Container.
 *
 * @param options {object} Optional configuration options
 * @param options.inherit {boolean} When <code>true</code>, the new child container inherits this container's
 *        resolvers. Defaults to <code>true</code>.
 */
C.newChild = function(options) {
  this._checkDisposed();

  options = options || {};

  var resolvers = this._containerResolvers;
  if (options.inherit === false) {
    resolvers = null;
  }

  var child = new Container(this, resolvers);

  return child;
};

/**
 * Use the given resolver middleware.
 * @param resolver {String|Function} The resolver to use. Supplying a String attempts to locate a standard resolver
 *        by name. Supplying a Function uses the Function itself as the resolver implementation.
 * @return {Container} <code>this</code>.
 * @see Resolver
 */
C.use = function(resolver) {
  this._checkDisposed();

  resolver = Resolver.normalize(resolver);
  this._containerResolvers.unshift(resolver);
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
 * Register the given component with this Container, making it available for resolution and as a
 * potential dependency of another component.
 *
 * @param key {String} The key associated with the component.
 * @param component {*} The component instance that will be tracked by this container.
 * @return {RegistrationBuilder} A registration builder to configure the registration.
 *
 * @throws AssertionError if key is not a string
 * @throws AssertionError if component is not defined or <code>null</code>.
 */
C.register = function(key, component, descriptor) {
  this._checkDisposed();

  assert(typeof key === 'string', "key must be a string");
  assert(!!component, "component must be defined");

  descriptor = new Descriptor(descriptor || component.$inject || []);

  var comp = this._createComponent(key, component, descriptor);
  this._registry[key] = comp;

  return new RegistrationBuilder(comp, descriptor);
};

C._createComponent = function(key, component, descriptor) {
  var comp = new Component(key, component, descriptor, this, this._containerResolvers);
  return comp;
};

C._get = function(key) {
  assert(typeof key === 'string', "key must be a string");
  if (!this._registry) {
    // If the container was disposed, behave like a 'not found' so we continue searching the parent
    return null;
  }
  return this._registry[key];
};

/**
 * Resolve an instance for the given component key. To resolve an instance, every associated resolver is passed
 * control and given the opportunity to create and configure the resulting component instance.
 * <p>
 * When resolving dependencies of the requested component, this same method is invoked internally.
 *
 * @param key {String} The component key with which to obtain an instance.
 * @param options {Object|undefined} Optional configuration options
 * @param options.optional {boolean} When <code>true</code>, in the event that the component cannot be resolved
 *        return <code>null</code> instead of throwing a ResolutionError.
 * @return {*|null} The resulting component instance.
 *
 * @throws AssertionError if key is not a string
 * @throws ResolutionError when the mandatory key cannot be located, or a failure occurs during the resolution process.
 * @throws Error if any resolver completes asynchronously
 */
C.resolve = function(key, options) {
  options = options || {};

  // Lookup the component
  var comp = this._get(key);

  // If the component is not found, delegate to the parent container
  if (!comp) {
    return this._parent.resolve(key, options);
  }

  // Resolve the component instance
  var resolution = comp.resolve(options);

  // If any resolver failed, bail now
  var err = resolution.error();
  if (err) {
    throw  err;
  }

  var instance = resolution.instance();

  return instance;
};

module.exports = Container;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Container.js","/")
},{"./Component":1,"./Descriptor":4,"./RegistrationBuilder":7,"./ResolutionError":10,"./Resolver":11,"1YiZ5S":27,"assert":22,"buffer":23}],3:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var assert = _dereq_('assert');

/**
 * Instances are created internally during component registration.
 *
 * @param key {String} The component key.
 * @param optional {boolean} <code>true</code> when the dependency is optional.
 * @constructor
 * @classdesc Private to junkie internals.
 */
function Dependency(key, optional) {
  assert(key, "key must be defined");

  this._key = key;
  this._optional = optional;
}

/** @lends Dependency# */
var D = Dependency.prototype;

/**
 * The key of the dependent component.
 * @return {String} The dependency key.
 */
D.key = function() {
  return this._key;
};

/**
 * Determine if the dependency is optional.
 * @return {boolean} <code>true</code> for an optional dependency.
 */
D.optional = function() {
  return this._optional;
};

/**
 *
 * @param key {String|Dependency}
 * @return {Dependency}
 */
Dependency.getOrCreate = function(keyOrDep, options) {
  if (keyOrDep instanceof Dependency) {
    return keyOrDep;
  }

  var optional = false;

  if (options && typeof options.optional === 'boolean') {
    optional = options.optional;
  }

  // Parse optional from key suffix
  var key = keyOrDep;
  if (key[key.length - 1] === '?') {
    key = key.substring(0, key.length - 1);
    optional = true;
  }

  return new Dependency(key, optional);
};

module.exports = Dependency;


}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Dependency.js","/")
},{"1YiZ5S":27,"assert":22,"buffer":23}],4:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var Dependency = _dereq_('./Dependency');

/**
 * @param entries
 * @constructor
 * @classdesc Private to junkie internals.
 */
function Descriptor(entries) {

  this._injectors = [];
  this._deps = {};

  if (entries) {
    this.addDeps(entries);
  }
}

var D = Descriptor.prototype;





D.addDep = function(dep) {
  dep = Dependency.getOrCreate(dep);
  this._deps[dep.key()] = dep;
};


D.addInjector = function(injector) {
  this._injectors.push(injector);
  this.addDeps(injector.deps());
};

D.addDeps = function(entries) {
  if (!Array.isArray(entries)) {
    throw new Error("descriptor entries must be an array");
  }

  entries.forEach(function(entry) {
    this.addDep(entry);
  }.bind(this));
};

D.injectors = function(name) {
  if (name) {
    return this._injectors.filter(function(injector) {
      return injector.name() === name;
    });
  } else {
    return this._injectors.slice();
  }
};

D.deps = function() {
  return this._deps.slice();
};


module.exports = Descriptor;


}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Descriptor.js","/")
},{"./Dependency":3,"1YiZ5S":27,"buffer":23}],5:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

/**
 * The abstract base type for an injector.
 * @param deps {Array.<Dependency>|null|undefined} An optional list of dependencies to inject.
 * @constructor
 */
function Injector(deps) {
  this._deps = deps || [];
}

/**
 * Validate an Injector sub-type for mandatory meta-data.
 * @param Type {Injector} The injector type to validate.
 * @throws Error if the injector type is invalid.
 */
Injector.validateType = function(Type) {

  // Sub-type validation
  var validation = {
    injectorName: 'string',
    createsInstance: 'boolean',
    allowsMultiples: 'boolean'
  };

  Object.keys(validation).forEach(function(name) {
    var expectedType = validation[name];
    if (typeof Type[name] !== expectedType) {
      throw new Error("Injector type must define boolean property: " + name);
    }
  });

};

/** @lends Injector# */
var I = Injector.prototype;

/**
 * Get a list of dependencies to be injected.
 * @return {Array.<Dependency>} The list of dependencies this injector will inject.
 */
I.deps = function() {
  return this._deps;
};

/**
 * Get the type name of this injector.
 * @return {String} The injector type name.
 */
I.injectorName = function() {
  return this.constructor.injectorName;
};

/**
 * Determine if this injector will create new component instances.
 * @return {boolean}
 */
I.createsInstance = function() {
  return this.constructor.createsInstance;
};

/**
 * Determine if this injector type can be associated in multiple for a single component resolution.
 * @return {boolean}
 */
I.allowsMultiples = function() {
  return this.constructor.allowsMultiples;
};

/**
 * @param component {*} The component being resolved.
 * @param deps {{list: [], map: {}} A structure containing resolved dependencies to inject.
 * @return {*} Optionally, the instance that will be the result of the component resolution.
 * @abstract
 */
I.inject = function(component, deps) {
  throw new Error("Sub-types of Injector must override the 'inject' method");
};

I.toString = function() {
  return this.constructor.name +
      "{name: " + this.injectorName() +
      ", createsInstance: " + this.createsInstance() +
      ", allowsMultiples: " + this.allowsMultiples() +
      "}";
};

module.exports = Injector;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Injector.js","/")
},{"1YiZ5S":27,"buffer":23}],6:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var Injector = _dereq_('./Injector');

var map = {};

/**
 * Manages types of injectors available to junkie.
 *
 * @class
 * @static
 */
var InjectorFactory = {

  /**
   * Create a new injector instance for the given injector type name.
   * @param name {String} The name of the injector to create.
   * @return {Injector} A new injector instance.
   * @throws Error when an injector type for the given name cannot be found.
   */
  create: function(name) {
    var args = Array.prototype.slice.apply(arguments);
    args.shift(); // remove name

    var Type = map[name];
    if (!Type) {
      throw new Error('Injector not found: ' + name);
    }

    var instance = Object.create(Type.prototype);
    Type.apply(instance, args);

    return instance;
  },

  /**
   * Obtain a list of injector names known to this factory.
   * @return {Array.<String>} Injector names.
   */
  names: function() {
    return Object.keys(map);
  },

  /**
   * Obtain a list of injector type objects known to this factory.
   * @return {Array.<Injector>} Injector type objects.
   */
  injectors: function() {
    return Object.keys(map).map(function(name) {
      return map[name];
    }.bind(this));
  },

  /**
   * Register an injector type with this factory, replacing any other for the given name that may have already existed.
   * @param Type {Injector} The injector type (constructor).
   */
  register: function(Type) {
    Injector.validateType(Type);
    map[Type.injectorName] = Type;
  }

};

// Register standard injectors
// (A loop would be nice, but browserify shits the bed)
var IF = InjectorFactory;
IF.register(_dereq_('./injector/ConstructorInjector'));
IF.register(_dereq_('./injector/CreatorInjector'));
IF.register(_dereq_('./injector/FactoryInjector'));
IF.register(_dereq_('./injector/FieldInjector'));
IF.register(_dereq_('./injector/MethodInjector'));

module.exports = InjectorFactory;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/InjectorFactory.js","/")
},{"./Injector":5,"./injector/ConstructorInjector":13,"./injector/CreatorInjector":14,"./injector/FactoryInjector":15,"./injector/FieldInjector":16,"./injector/MethodInjector":17,"1YiZ5S":27,"buffer":23}],7:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var InjectorFactory = _dereq_('./InjectorFactory');

var Dependency = _dereq_('./Dependency');
var Resolver = _dereq_('./Resolver');

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
  var injector = InjectorFactory.create.apply(null, args);
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

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/RegistrationBuilder.js","/")
},{"./Dependency":3,"./InjectorFactory":6,"./Resolver":11,"1YiZ5S":27,"buffer":23}],8:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

/**
 * <strong>Private constructor</strong>. Instances are normally created internally and passed to resolvers.
 * @param component
 * @constructor
 */
function Resolution(component) {
  this._component = component;

  this._instance = null;
  this._error = null;
  this._done = false;
}

/** @lends Resolution# */
var R = Resolution.prototype;

/**
 * Resolve the given instance of a component. This will be come the result of the {@link Container#resolve} call that
 * triggered this resolution.
 * @param instance {*} The instance to resolve, or <code>null</code> or <code>undefined</code> to cancel a
 *        previously resolved instance.
 */
R.resolve = function(instance) {
  this._instance = instance;
};

/**
 * Fail this resolution with the given error.
 * @param error {Error} The error representing the cause of the resolution failure.
 */
R.fail = function(error) {
  this._error = error;
};

/**
 * Mark this resolution as done regardless of the current resolved or failed state. "Done" means that, even though
 * a resolver will call the <code>next()</code> callback, the process will be aborted and no further resolvers will
 * be invoked.
 */
R.done = function() {
  this._done = true;
};

/**
 * Obtain the component instance. This remains unchanged for the course of the resolution process and is equal
 * to the instance given to the {@link Container#register} call.
 * @return {*} The component instance. Never <code>null</code>.
 */
R.component = function() {
  return this._component;
};

/**
 * Get the instance that will be the result of the component resolution. This instance is set by
 * the {@link #resolve} method.
 * @return {*|null}
 */
R.instance = function() {
  return this._instance;
};

/**
 * Get the resolved component instance, or if not available, the component itself. As, if an instance is never
 * resolved by the resolvers the resolution result becomes the component itself, this method is useful for resolvers
 * that operate on the resolution result in any case.
 * @return {*} The resolved instance or component. Never <code>null</code>.
 */
R.instanceOrComponent = function() {
  return this._instance || this._component;
};

/**
 * Get the error that failed the resolution. This error was set by the {@link #fail} method.
 * @return {Error|null} The resolution failure error, or <code>null</code> if not failed.
 */
R.error = function() {
  return this._error;
};

/**
 * Determine if this resolution is done; that further resolvers will not be invoked.
 * @return {boolean} The done state of this component resolution.
 */
R.isDone = function() {
  return this._done;
};

R.toString = function() {
  return "Resolution{" +
    "instance: " + this._instance +
    ", error: " + this._error +
    ", done: " + this._done +
    "}";
};

module.exports = Resolution;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Resolution.js","/")
},{"1YiZ5S":27,"buffer":23}],9:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var Dependency = _dereq_('./Dependency');

/**
 * <strong>Private constructor</strong>. Instances are normally created internally and passed to resolvers.
 * @param options
 * @constructor
 */
function ResolutionContext(options) {
  this._previous = options.previous;
  this._container = options.container;
  this._key = options.key;
  this._component = options.component;
  this._descriptor = options.descriptor;
  this._store = options.store;
}

/** @lends ResolutionContext# */
var RC = ResolutionContext.prototype;

/**
 * Obtain the previous context in the resolution chain.
 * @return {ResolutionContext|null}
 */
RC.previous = function() {
  return this._previous;
};

RC.keyStack = function() {
  var stack = [];
  var ctx = this;
  do {
    stack.unshift(ctx.key());
    ctx = ctx.previous();
  } while (ctx);
  return stack;
};

/**
 * Get the key of the component being resolved.
 * @return {String} The component key.
 */
RC.key = function() {
  return this._key;
};

/**
 * Get the component being resolved. This is the same instance
 * that was passed into the {@link Container#register} method.
 * @return {*}
 */
RC.component = function() {
  return this._component;
};

/**
 * Provides access to arbitrary data that is stored at the scope of the component registration.
 * This allows a resolver to preserve state across several resolutions of a single component.
 *
 * @param key {String} The optional data key.
 * @param value {*} The optional data value.
 *
 * @example
 * // Set a value
 * ctx.store('dogCount', 3);
 *
 * // Get a value
 * ctx.store('dogCount'); // -> 3
 *
 * // Get all values
 * ctx.store(); // -> { 'dogCount': 3 }
 */
RC.store = function(key, value) {
  if (key === undefined) {
    return this._store;
  } else if (value === undefined) {
    return this._store[key];
  } else {
    this._store[key] = value;
  }
};

/**
 * Resolve the given Dependency instance or instances using the same container in which
 * the component for this resolution lives.
 *
 * @param deps {String|Array.<String>|Dependency|Array.<Dependency>} A Dependency instance or Array of instances.
 * @param options {Object|undefined} Optional configuration options.
 *
 * @return {{map: {}, list: Array}} A structure containing resolved dependencies. The 'map' property
 */
RC.resolve = function(deps, options) {
  var single = !Array.isArray(deps);
  if (single) {
    deps = [ deps ];
  }

  var resolvedDeps = {
    map: {},
    list: []
  };

  deps
    .map(function(dep) {
      return Dependency.getOrCreate(dep, options);
    })
    .forEach(function(dep) {
      var resolvedDep = this._container.resolve(dep.key(), {
        optional: dep.optional(),
        resolutionContext: this
      });
      resolvedDeps.map[dep.key()] = resolvedDep;
      resolvedDeps.list.push(resolvedDep);
    }.bind(this));

  if (single) {
    return resolvedDeps.list[0];
  }
  return resolvedDeps;
};

/**
 * Obtain the injector that will create an instance of the component.
 * @return {Injector|null} The instance-creating injector or <code>null</code> if none are present.
 * @throws Error if multiple instance-creating injectors are present.
 */
RC.creatorInjector = function() {
  var injectors =
    this._descriptor
      .injectors()
      .filter(function(injector) {
        return injector.createsInstance();
      });

  if (injectors.length > 1) {
    throw new Error("Multiple creator injectors");
  }

  return injectors[0] || null;
};

/**
 * Obtain the injectors that inject dependencies into an already-created component instance.
 * @return {Array.<Injector>} Configuration injectors, or an empty Array if none are present.
 */
RC.configurationInjectors = function() {
  return this._descriptor
    .injectors()
    .filter(function(injector) {
      return !injector.createsInstance();
    });
};

/**
 * Obtain a list of all injectors associated with this component resolution, or optionally,
 * a list of all associated injectors of a given name.
 * @param name {String|undefined} The optional name by which to filter returned injectors.
 * @return {Array.<Injector>} A list of injectors associated with this component resolution.
 */
RC.injectors = function(name) {
  return this._descriptor.injectors(name);
};

/**
 * Get a list of Dependency instances that are associated with this component resolution. This is the full list
 * of dependencies, each of which also being available through inspecting related injectors. In other words,
 * each injector for this resolution owns a subset of this list of dependencies.
 *
 * These are not yet resolved. To resolve the actual instance of a dependent component, use the {@link #resolve} method.
 * @return {Array.<Dependency>} A list of dependencies.
 */
RC.deps = function() {
  return this._descriptor.deps();
};


RC.toString = function() {
  return "ResolutionContext{" +
    ", keyStack: " + this.keyStack() +
    ", storeKeys: " + Object.keys(this.store()) +
    ", injectorCount: " + this.injectors().length +
    "}";
};

module.exports = ResolutionContext;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/ResolutionContext.js","/")
},{"./Dependency":3,"1YiZ5S":27,"buffer":23}],10:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var util = _dereq_('util');

/**
 * An Error that is thrown from a {@link Container#resolve} call upon a failure.
 *
 * @param message
 * @constructor
 */
function ResolutionError(message) {
  Error.call(this);
  this.message = message;
}
ResolutionError.prototype.type = 'ResolutionError';
ResolutionError.prototype.constructor = ResolutionError;
util.inherits(ResolutionError, Error);

module.exports = ResolutionError;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/ResolutionError.js","/")
},{"1YiZ5S":27,"buffer":23,"util":29}],11:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var assert = _dereq_('assert');
var ResolutionError = _dereq_('./ResolutionError');

/**
 * Instances are created internally during calls to {@link Container#use} and {@link RegistrationBuilder#use}.
 *
 * @param impl {Function} The resolver implementation.
 * @param args {Array} The arguments to make available to the resolver implementation.
 * @constructor
 * @classdesc Private to junkie internals.
 */
function Resolver(impl, args) {
  assert(typeof impl === 'function', "Resolver must be a function: " + impl);
  this._impl = impl;
  this._args = args || [];
}

/** @lends Resolver# */
var R = Resolver.prototype;

R.resolve = function(ctx, res, next) {
  var resolverThis = this._createResolverThis();
  try {
    this._impl.call(resolverThis, ctx, res, next);
  } catch (e) {
    res.fail(e);
    return next();
  }
};

R._createResolverThis = function() {
  return {
    arg: this.arg.bind(this),
    args: this.args.bind(this)
  };
};

R.arg = function(i, failMessage) {
  var val = this._args[i];
  if (!val) {
    throw new ResolutionError(failMessage ||
      ("Resolver " + this._impl.name + " requires argument at index: " + i));
  }
  return val;
};

R.args = function() {
  return this._args.slice();
};

// Dynamic requires would be nice, but browserify shits the bed
Resolver.StandardResolvers = Object.freeze({
  caching: _dereq_('./resolver/caching'),
  decorator: _dereq_('./resolver/decorator'),
  injector: _dereq_('./resolver/injector'),
  logging: _dereq_('./resolver/logging')
});

Resolver.normalize = function(resolver, args) {
  assert(!!resolver, "resolver must be defined");
  if (typeof resolver === 'string') {
    resolver = Resolver.StandardResolvers[resolver];
  }

  assert(typeof resolver === 'object' ||
    typeof resolver === 'function', "resolver must be a function or object");

  if (!(resolver instanceof Resolver)) {
    resolver = new Resolver(resolver, args);
  }

  return resolver;
};

module.exports = Resolver;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/Resolver.js","/")
},{"./ResolutionError":10,"./resolver/caching":18,"./resolver/decorator":19,"./resolver/injector":20,"./resolver/logging":21,"1YiZ5S":27,"assert":22,"buffer":23}],12:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var Container = _dereq_('./Container');
var Injector = _dereq_('./Injector');
var InjectorFactory = _dereq_('./InjectorFactory');
var ResolutionError = _dereq_('./ResolutionError');

/**
 * The main entry point into doing anything with junkie.
 *
 * @namespace
 */
var junkie = {};

/**
 * Create a new Container
 * @return Container
 */
junkie.newContainer = function() {
  return new Container();
};

// Expose public types

/**
 * @type {Injector}
 */
junkie.Injector = Injector;

/**
 *
 * @type {InjectorFactory}
 */
junkie.InjectorFactory = InjectorFactory;

/**
 *
 * @type {ResolutionError}
 */
junkie.ResolutionError = ResolutionError;

module.exports = junkie;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_a1ca2734.js","/")
},{"./Container":2,"./Injector":5,"./InjectorFactory":6,"./ResolutionError":10,"1YiZ5S":27,"buffer":23}],13:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var util = _dereq_('util');
var Injector = _dereq_('../Injector');
var ResolutionError = _dereq_('../ResolutionError');

/**
 * Creates a new component instance using a constructor.
 * @param deps {Array.<Dependency>|null|undefined} An optional list of dependencies to inject.
 * @constructor
 * @extends Injector
 */
function ConstructorInjector(deps) {
  Injector.call(this, deps);
}
util.inherits(ConstructorInjector, Injector);

ConstructorInjector.injectorName = "constructor";
ConstructorInjector.createsInstance = true;
ConstructorInjector.allowsMultiples = false;

/** @lends ConstructorInjector# */
var CI = ConstructorInjector.prototype;

/**
 * Calls <code>new</code> on the component, passing in the list of dependencies as arguments.
 * @param Type {Function} The component being resolved.
 * @param deps {{list: [], map: {}} A structure containing resolved dependencies to inject.
 * @return The instance that will be the result of the component resolution.
 */
CI.inject = function(Type, deps) {
  if (typeof Type !== 'function') {
    throw new ResolutionError("Constructor injector: Component must be a function: " + (typeof Type));
  }

  var instance = Object.create(Type.prototype);
  Type.apply(instance, deps.list);
  return instance;
};

module.exports = ConstructorInjector;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/injector/ConstructorInjector.js","/injector")
},{"../Injector":5,"../ResolutionError":10,"1YiZ5S":27,"buffer":23,"util":29}],14:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var util = _dereq_('util');
var Injector = _dereq_('../Injector');
var ResolutionError = _dereq_('../ResolutionError');

/**
 * Creates a new component instance using a prototype object.
 * @param deps {Array.<Dependency>|null|undefined} An optional list of dependencies to inject.
 * @constructor
 * @extends Injector
 */
function CreatorInjector(deps, targetInitializer) {
  Injector.call(this, deps);
  this._targetInitializer = targetInitializer;
}
util.inherits(CreatorInjector, Injector);

CreatorInjector.injectorName = "creator";
CreatorInjector.createsInstance = true;
CreatorInjector.allowsMultiples = false;

/** @lends CreatorInjector# */
var CI = CreatorInjector.prototype;

/**
 * Calls <code>Object#create</code> on the component, treating it as a prototype, passing in the list of dependencies
 * as arguments.
 * @param proto {Object} The component being resolved.
 * @param deps {{list: [], map: {}} A structure containing resolved dependencies to inject.
 * @return The instance that will be the result of the component resolution.
 */
CI.inject = function(proto, deps) {
  var instance = Object.create(proto);

  if (this._targetInitializer) {
    var initializer = instance[this._targetInitializer];
    if (typeof initializer !== 'function') {
      throw new ResolutionError("Creator injector: Initializer function not found: " + this._targetInitializer);
    }
    initializer.apply(instance, deps.list);

  } else {
    if (deps.list.length > 0) {
      throw new ResolutionError("Creator injector: Initializer function not specified, but dependencies supplied");
    }
  }

  return instance;
};

module.exports = CreatorInjector;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/injector/CreatorInjector.js","/injector")
},{"../Injector":5,"../ResolutionError":10,"1YiZ5S":27,"buffer":23,"util":29}],15:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var util = _dereq_('util');
var Injector = _dereq_('../Injector');
var ResolutionError = _dereq_('../ResolutionError');

/**
 * Creates a new component instance using a factory function.
 * @param deps {Array.<Dependency>|null|undefined} An optional list of dependencies to inject.
 * @constructor
 * @extends Injector
 */
function FactoryInjector(deps) {
  Injector.call(this, deps);
}
util.inherits(FactoryInjector, Injector);

FactoryInjector.injectorName = "factory";
FactoryInjector.createsInstance = true;
FactoryInjector.allowsMultiples = false;

/** @lends FactoryInjector# */
var CI = FactoryInjector.prototype;

/**
 * Calls the component function passing in the list of dependencies as arguments, and the returned result is
 * resolved as the component instance.
 *
 * @param factory {Function} The component being resolved.
 * @param deps {{list: [], map: {}} A structure containing resolved dependencies to inject.
 * @return The instance that the factory produced.
 */
CI.inject = function(factory, deps) {
  if (typeof factory !== 'function') {
    throw new ResolutionError("Factory injector: Component must be a function: " + (typeof factory));
  }

  var instance = factory.apply(factory, deps.list);
  return instance;
};

module.exports = FactoryInjector;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/injector/FactoryInjector.js","/injector")
},{"../Injector":5,"../ResolutionError":10,"1YiZ5S":27,"buffer":23,"util":29}],16:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var util = _dereq_('util');
var Injector = _dereq_('../Injector');
var ResolutionError = _dereq_('../ResolutionError');

/**
 * Injects a dependency into a component instance field.
 * @param deps {Array.<Dependency>|null|undefined} An optional list of dependencies to inject.
 * @param targetField {String} The name of the field into which a dependency will be injected.
 * @constructor
 * @extends Injector
 */
function FieldInjector(deps, targetField) {
  Injector.call(this, deps);
  this._targetField = targetField;
}
util.inherits(FieldInjector, Injector);

FieldInjector.injectorName = "field";
FieldInjector.createsInstance = false;
FieldInjector.allowsMultiples = true;

/** @lends FieldInjector# */
var CI = FieldInjector.prototype;

/**
 * Assigns a single dependency to the target field on the component instance.
 *
 * @param instance {Function} The component being resolved.
 * @param deps {{list: [], map: {}} A structure containing resolved dependencies to inject.
 * @throws ResolutionError when the number of dependencies is not <code>1</code>.
 */
CI.inject = function(instance, deps) {
  if (deps.list.length !== 1) {
    throw new ResolutionError("Field injector: Must inject exactly one dependency");
  }
  instance[this._targetField] = deps.list[0];
};

module.exports = FieldInjector;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/injector/FieldInjector.js","/injector")
},{"../Injector":5,"../ResolutionError":10,"1YiZ5S":27,"buffer":23,"util":29}],17:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";
var util = _dereq_('util');
var Injector = _dereq_('../Injector');
var ResolutionError = _dereq_('../ResolutionError');

/**
 * Injects dependencies into a method of a component instance.
 * @param deps {Array.<Dependency>|null|undefined} An optional list of dependencies to inject.
 * @param targetMethod {String} The name of the method into which dependencies will be injected.
 * @constructor
 * @extends Injector
 */
function MethodInjector(deps, targetMethod) {
  Injector.call(this, deps);
  this._targetMethod = targetMethod;
}
util.inherits(MethodInjector, Injector);

MethodInjector.injectorName = "method";
MethodInjector.createsInstance = false;
MethodInjector.allowsMultiples = true;

/** @lends MethodInjector# */
var CI = MethodInjector.prototype;

/**
 * Passes dependencies as arguments to the target method on the component instance.
 *
 * @param instance {Function} The component being resolved.
 * @param deps {{list: [], map: {}} A structure containing resolved dependencies to inject.
 * @throws ResolutionError when the number of dependencies is not <code>1</code>.
 */
CI.inject = function(instance, deps) {
  var m = instance[this._targetMethod];
  if (typeof m !== 'function') {
    throw new ResolutionError("Method injector: Method not found: " + this._targetMethod);
  }

  m.apply(instance, deps.list);
};

module.exports = MethodInjector;

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/injector/MethodInjector.js","/injector")
},{"../Injector":5,"../ResolutionError":10,"1YiZ5S":27,"buffer":23,"util":29}],18:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var cacheKey = 'caching_instance';

/**
 * Searches the {@link Component#store} for a cached instance of a previously resolved component. If one
 * is found, it is resolved and the resolution is marked as done. Otherwise, the next resolvers are called,
 * and when they complete, the resulting resolved instance is cached such that subsequent resolves will
 * return this instance.
 *
 * @function
 * @exports Resolver:caching
 */
module.exports = function caching(ctx, res, next) {
  var cached = ctx.store(cacheKey);
  if (cached) {
    res.resolve(cached);
    res.done();
  }

  next();

  ctx.store(cacheKey, res.instanceOrComponent());
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/caching.js","/resolver")
},{"1YiZ5S":27,"buffer":23}],19:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var ResolutionError = _dereq_('../ResolutionError');

function resolveDecoratorArg(resolver, ctx) {
  var decorator = resolver.arg(0,
    "decorator resolver requires argument of string dependency key or factory function");

  if (typeof decorator === 'string') {
    decorator = ctx.resolve(decorator);
  }
  if (typeof decorator !== 'function') {
    console.log(decorator);
    throw new ResolutionError("decorator must be a factory function");
  }

  return decorator;
}

/**
 * Wraps the previously resolved instance or the component with a decorator by calling a decorator factory function.
 *
 * A decorator resolver requires a second argument to the {@link Container#use} or {@link RegistrationBuilder#use}
 * call with which it is being used. This argument specifies the decorator factory and is either:
 * <ul>
 *   <li>A <code>String</code> key of the decorator factory to resolve</li>
 *   <li>A <code>Function</code> that is the decorator factory</li>
 * </ul>
 *
 * @function
 * @exports Resolver:decorator
 */
module.exports = function decorator(ctx, res, next) {
  var decoratorFactory = resolveDecoratorArg(this, ctx);

  next();

  var decorated = decoratorFactory(res.instanceOrComponent());
  if (decorated === undefined || decorated === null) {
    throw new ResolutionError('decorator factory did not return instance when resolving: ' + ctx.key());
  }

  res.resolve(decorated);
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/decorator.js","/resolver")
},{"../ResolutionError":10,"1YiZ5S":27,"buffer":23}],20:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

var ResolutionError = _dereq_('../ResolutionError');

/**
 * If an instance-creating injector is associated with the component, it is invoked and the resulting instance
 * is resolved. The next resolvers are then executed, and after they complete, any remaining injectors are
 * given the opportunity to inject into the resolved instance.
 *
 * @function
 * @exports Resolver:injector
 */
module.exports = function injector(ctx, res, next) {
  var creatorInjector = ctx.creatorInjector();
  if (creatorInjector) {
    var deps = ctx.resolve(creatorInjector.deps());
    var inst = creatorInjector.inject(ctx.component(), deps);
    if (!inst) {
      throw new ResolutionError("Injector did not return an instance: " + creatorInjector.name());
    }

    res.resolve(inst);
  }

  next();

  ctx.configurationInjectors()
    .forEach(function(injector) {
      var deps = ctx.resolve(injector.deps());
      injector.inject(res.instanceOrComponent(), deps);
    });
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/injector.js","/resolver")
},{"../ResolutionError":10,"1YiZ5S":27,"buffer":23}],21:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
"use strict";

module.exports = function loggingResolver(ctx, res, next) {
  console.log("Junkie: key stack: ", ctx.keyStack().join(' -> '));
  next();
  console.log("Junkie: resolved key", ctx.key(), "=", res.instance());
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/resolver/logging.js","/resolver")
},{"1YiZ5S":27,"buffer":23}],22:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = _dereq_('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/assert/assert.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/assert")
},{"1YiZ5S":27,"buffer":23,"util/":29}],23:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = _dereq_('base64-js')
var ieee754 = _dereq_('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    for (i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function _asciiWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function _utf16leWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = _asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = _binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = _base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = _asciiSlice(self, start, end)
      break
    case 'binary':
      ret = _binarySlice(self, start, end)
      break
    case 'base64':
      ret = _base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++)
      target[i + target_start] = this[i + start]
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i+1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1)
        buf[i] = this[i]
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/index.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer")
},{"1YiZ5S":27,"base64-js":24,"buffer":23,"ieee754":25}],24:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib")
},{"1YiZ5S":27,"buffer":23}],25:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/ieee754")
},{"1YiZ5S":27,"buffer":23}],26:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/inherits/inherits_browser.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/inherits")
},{"1YiZ5S":27,"buffer":23}],27:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/process/browser.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/process")
},{"1YiZ5S":27,"buffer":23}],28:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/util/support/isBufferBrowser.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/util/support")
},{"1YiZ5S":27,"buffer":23}],29:[function(_dereq_,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},_dereq_("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/util/util.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/util")
},{"./support/isBuffer":28,"1YiZ5S":27,"buffer":23,"inherits":26}]},{},[12])
(12)
});