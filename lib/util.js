"use strict";

module.exports.assert = function(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
};

// "inherits" function: shamelessly lifted from browserified util shim for the sake of
// not including the entire util module
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  };
}
