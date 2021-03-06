"use strict";
var Container = require('./Container');
var ResolutionError = require('./ResolutionError');

/**
 * The main entry point into doing anything with junkie.
 *
 * @namespace
 */
var junkie = {};

/**
 * Create a new Container
 * @returns Container
 */
junkie.newContainer = function() {
  return new Container();
};

// Expose public types

/**
 * An Error subtype thrown in {@link Container#resolve} calls.
 * @type {ResolutionError}
 */
junkie.ResolutionError = ResolutionError;

module.exports = junkie;
