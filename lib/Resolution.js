"use strict";

function Resolution(component) {
  this._component = component;

  this._done = false;
}

var R = Resolution.prototype;

R.resolve = function(instance) {
  this._instance = instance;
};

R.fail = function(error) {
  this._error = error;
};

R.done = function() {
  this._done = true;
};

R.component = function() {
  return this._component;
};

R.instance = function() {
  return this._instance;
};

R.instanceOrComponent = function() {
  return this._instance || this._component;
};

R.error = function() {
  return this._error;
};

R.isDone = function() {
  return this._done;
};

R.toString = function() {
  return "Resolution[" +
    "instance=" + this._instance +
    ",error=" + this._error +
    ",done=" + this._done +
    "]";
};

module.exports = Resolution;
