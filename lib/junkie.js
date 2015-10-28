"use strict";
var Container = require('./Container');
var InjectorFactory = require('./InjectorFactory');

var junkie = {};

junkie.newContainer = function() {
  return new Container();
};

junkie.InjectorFactory = InjectorFactory;

module.exports = junkie;
