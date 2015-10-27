
function ResolutionContext(container, key, component, descriptor) {
  this._container = container;
  this._key = key;
  this._component = component;
  this._descriptor = descriptor;
}

const RC = ResolutionContext.prototype;

RC.key = function() {
  return this._key;
};

RC.component = function() {
  return this._component;
};

RC.resolve = function(deps) {
  var asArray = true;
  if (!Array.isArray(deps)) {
    deps = [ deps ];
    asArray = false;
  }

  deps = deps.map(function(dep) {
    return this._container.resolve(dep);
  }.bind(this));

  //console.log("ResolutionContext#resolve result", deps);

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
