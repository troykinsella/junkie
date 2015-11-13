"use strict";

var ResolutionError = require('./ResolutionError');

/**
 * <strong>Private constructor</strong>. Instances are normally created internally and passed to resolvers.
 * @param component
 * @constructor
 */
function Resolution() {
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
 * Get the instance that will be the result of the component resolution. This instance is set by
 * the {@link #resolve} method.
 * @param require {boolean|undefined} <code>true</code> if the instance must be defined, <code>false</code> if the
 *        instance must not be defined, or omit the parameter if no defined checks should occur.
 * @return {*|null}
 * @throws ResolutionError when <code>require</code> is <code>true</code> and the instance is <code>null</code>
 *                         or <code>require</code> is <code>false</code> and the instance is not <code>null</code>.
 */
R.instance = function(require) {
  var i = this._instance;

  if (require !== undefined) {
    if (require && i === null) {
      throw new ResolutionError("Resolver requires instance to be resolved");
    } else if (!require && i !== null) {
      throw new ResolutionError("Resolver requires instance to be resolved");
    }
  }

  return i;
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
