"use strict";
var assert = require('../util').assert;
var ResolutionError = require('../ResolutionError');

// This madness is necessary because Function.apply/call doesn't work on ES6 classes.
function callCtor(Type, deps) {
  var i;
  switch (deps.length) {
    case 0:  i = new Type(); break;
    case 1:  i = new Type(deps[0]); break;
    case 2:  i = new Type(deps[0], deps[1]); break;
    case 3:  i = new Type(deps[0], deps[1], deps[2]); break;
    case 4:  i = new Type(deps[0], deps[1], deps[2], deps[3]); break;
    case 5:  i = new Type(deps[0], deps[1], deps[2], deps[3], deps[4]); break;
    case 6:  i = new Type(deps[0], deps[1], deps[2], deps[3], deps[4], deps[5]); break;
    case 7:  i = new Type(deps[0], deps[1], deps[2], deps[3], deps[4], deps[5], deps[6]); break;
    case 8:  i = new Type(deps[0], deps[1], deps[2], deps[3], deps[4], deps[5], deps[6], deps[7]); break;
    case 9:  i = new Type(deps[0], deps[1], deps[2], deps[3], deps[4], deps[5], deps[6], deps[7], deps[8]); break;
    case 10: i = new Type(deps[0], deps[1], deps[2], deps[3], deps[4], deps[5], deps[6], deps[7], deps[8], deps[9]); break;
    default: throw new Error("Seriously? You have more than 10 constructor parameters?");
  }
  return i;
}

/**
 * Creates a new component instance using a constructor.
 *
 * @function
 * @exports Resolver:constructor
 * @throws ResolutionError if the component is not a function.
 */
module.exports = function constructor(ctx, res, next) {
  res.instance(false);

  var Type = ctx.component();
  assert.type(Type,
    'function',
    "Constructor resolver: Component must be a function: " + (typeof Type),
    ResolutionError);

  ctx.resolve(this.args())
    .then(function(deps) {
      try {
        var instance = callCtor(Type, deps.list);
        res.resolve(instance);
      } catch (e) {
        res.fail(e);
      }

      next();
    })
    .catch(function(err) {
      res.fail(err);
      next();
    });
};
