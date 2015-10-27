
const Dependency = require('../Dependency');
const InjectorFactory = require('./InjectorFactory');


function descriptorEntryParser(str) {

  var injectorName;

  var parts = str.split('!');
  if (parts.length > 1) {
    injectorName = parts[0];
    str = parts[1];
  } else {
    injectorName = "constructor"; // default TODO: less lame
  }

  var deps = [];

  parts = str.split(',');
  parts.forEach(function(dep) {
    deps.push(Dependency.parse(dep));
  });

  var injector = InjectorFactory.create(injectorName, deps);

  return {
    deps: deps,
    injector: injector
  };
};

module.exports = descriptorEntryParser;
