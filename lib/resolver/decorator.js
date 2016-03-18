"use strict";
var assert = require('../util').assert;
var ResolutionError = require('../ResolutionError');


/**
 * Wraps the previously resolved instance or the component with a decorator by calling a decorator factory function.
 *
 * A decorator resolver requires a second argument to the {@link Container#use} or {@link RegistrationBuilder#use}
 * call with which it is being used. This argument specifies the decorator factory and is either:
 * <ul>
 *   <li>A <code>String</code> key of the decorator factory to resolve</li>
 *   <li>A <code>Function</code> that is the decorator factory</li>
 * </ul>
 *
 * @function
 * @exports Resolver:decorator
 * @throws ResolutionError if the decorator factory is not a function or returns <code>undefined<code> or <code>null</code>
 */
module.exports = function decorator(ctx, res, next) {
  var dec = this.arg(0,
    "decorator resolver requires argument of string dependency key or factory function");

  function result(resolvedDecFn) {
    assert.type(resolvedDecFn,
      'function',
      "decorator must be a factory function",
      ResolutionError);

    var decorated = resolvedDecFn(res.instance() || ctx.component());
    if (decorated === undefined || decorated === null) {
      var err = new ResolutionError('decorator factory did not return instance when resolving: ' + ctx.key());
      return res.fail(err);
    }
    res.resolve(decorated);
    next();
  }

  if (typeof dec === 'string') {
    ctx.resolve(dec)
      .then(result)
      .catch(function(err) {
        res.fail(err);
        next();
      });
  } else {
    result(dec);
  }
};
