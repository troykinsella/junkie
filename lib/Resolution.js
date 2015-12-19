"use strict";
/*jshint eqnull:true */
var EventEmitter = require('events').EventEmitter;
var util = require('./util');
var ResolutionError = require('./ResolutionError');

var assert = util.assert;

/**
 * <strong>Private constructor</strong>. Instances are normally created internally and passed to resolvers.
 * @constructor
 */
function Resolution() {
  EventEmitter.call(this);
  this._done = false;

  this.fail = this.fail.bind(this); // Bind so resolution.fail can be used as a promise catch() handler
}
util.inherits(Resolution, EventEmitter);

/** @lends Resolution# */
var R = Resolution.prototype;

/**
 * Resolve the given instance of a component. This will be come the result of the {@link Container#resolve} call that
 * triggered this resolution.
 * @param instance {*|null} The instance to resolve.
 */
R.resolve = function(instance) {
  assert(instance !== undefined,
    "Resolver attempted to resolve undefined instance",
    ResolutionError);
  assert(!this._committed,
    "Resolution has already been committed",
    ResolutionError);
  this._instance = instance;
};

/**
 *
 * @returns {boolean}
 */
R.resolved = function() {
  return this._instance !== undefined;
};

/**
 * Fail this resolution with the given error.
 * @param error {Error} The error representing the cause of the resolution failure.
 */
R.fail = function(error) {
  this._error = error;
};

/**
 * Determine if the resolution has failed.
 * @returns {boolean} <code>true</code> if #fail was called with an error.
 */
R.failed = function() {
  return !!this._error;
};

/**
 * Mark this resolution as done regardless of the current resolved or failed state. "Done" means that, even though
 * a resolver may call the <code>next()</code> callback, the process will be aborted and no further resolvers will
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
 * @returns {*|null}
 * @throws ResolutionError when <code>require</code> is <code>true</code> and the instance isn't defined
 *                         or <code>require</code> is <code>false</code> and the instance is defined.
 */
R.instance = function(require) {
  var i = this._instance;

  if (require !== undefined) {
    assert(!require || i != null,
      "Resolver requires instance to be resolved",
      ResolutionError);
    assert(require || i == null,
      "Resolver requires instance to not yet be resolved",
      ResolutionError);
  }

  return i;
};

/**
 * Get the error that failed the resolution. This error was set by the {@link #fail} method.
 * @returns {Error|null} The resolution failure error, or <code>null</code> if not failed.
 */
R.error = function() {
  return this._error || null;
};

/**
 * Determine if this resolution is done; that further resolvers will not be invoked.
 * @returns {boolean} The done state of this component resolution.
 */
R.isDone = function() {
  return !!this._done;
};

/**
 * Mark this bastard as committed.
 * @private
 */
R._commit = function() {
  assert(!this._committed, "Resolution#commit called twice");
  this._committed = true;
  this.emit('committed', this);
};

/**
 *
 * @param resolve
 * @param reject
 * @private
 */
R._onCommit = function(resolve, reject) {
  this.once('committed', function() {
    if (this.failed()) {
      return reject(this.error());
    }
    resolve(this.instance());
  }.bind(this));
};

/**
 * Obtain an ES6 Promise that will be resolved when the final instance and state has been resolved.
 * Otherwise, it will be rejected with the cause of the resolution failure.
 * @returns {Promise}
 */
R.committed = function() {
  if (this._committed) {
    return Promise.resolve(this.instance());
  }
  return new Promise(this._onCommit.bind(this));
};

R.toString = function() {
  return "Resolution {" +
    "instance: " + this.instance() +
    ", error: " + this.error() +
    ", done: " + this.isDone() +
    "}";
};

module.exports = Resolution;
