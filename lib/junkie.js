"use strict";
var Container = require('./Container');
var InjectorFactory = require('./InjectorFactory');

/**
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

junkie.InjectorFactory = InjectorFactory;
console.log(junkie);
module.exports = junkie;
