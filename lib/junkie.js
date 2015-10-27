
const Container = require('./Container');
const InjectorFactory = require('./InjectorFactory');

const junkie = {};

junkie.newContainer = function() {
  return new Container();
};

junkie.InjectorFactory = InjectorFactory;

module.exports = junkie;
