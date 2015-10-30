"use strict";
var util = require('util');

/**
 * An Error that is thrown from a Container#resolve call upon a failure.
 *
 * @param message
 * @constructor
 */
function ResolutionError(message) {
  Error.call(this);
  this.message = message;
}
ResolutionError.prototype.type = 'ResolutionError';
ResolutionError.prototype.constructor = ResolutionError;
util.inherits(ResolutionError, Error);

module.exports = ResolutionError;
