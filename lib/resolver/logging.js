"use strict";

module.exports = function logging(ctx, res, next) {
  console.log("Junkie: key stack: ", ctx.keyStack().join(' -> '));
  next();
  console.log("Junkie: resolved key", ctx.key(), "=", res.instance());
};
