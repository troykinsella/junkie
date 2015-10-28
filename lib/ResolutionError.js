"use strict";
var util = require('util');

function ResolutionError(message) {
  Error.call(this);
  this.message = message;
}
ResolutionError.prototype.type = 'ResolutionError';
ResolutionError.prototype.constructor = ResolutionError;
util.inherits(ResolutionError, Error);

module.exports = ResolutionError;
