"use strict";
var Container = require('./Container');
var Injector = require('./Injector');
var InjectorFactory = require('./InjectorFactory');
var ResolutionError = require('./ResolutionError');

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
