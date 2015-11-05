"use strict";
var inherits = require('./util').inherits;

/**
 * An Error that is thrown from a {@link Container#resolve} call upon a failure.
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
inherits(ResolutionError, Error);

module.exports = ResolutionError;
