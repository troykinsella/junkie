"use strict";

var cacheKey = 'cachingResolver_instance';

module.exports = function cachingResolver(ctx, res, next) {
  var cached = ctx.store(cacheKey);
  if (cached) {
    res.resolve(cached);
    res.done();
  }

  next();

  ctx.store(cacheKey, res.instanceOrComponent());
};
