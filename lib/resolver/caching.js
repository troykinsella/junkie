"use strict";

var cacheKey = 'caching_instance';

/**
 * Searches the {@link Component#store} for a cached instance of a previously resolved component. If one
 * is found, it is resolved and the resolution is marked as done. Otherwise, the next resolvers are called,
 * and when they complete, the resulting resolved instance is cached such that subsequent resolves will
 * return this instance.
 *
 * @function
 * @exports Resolver:caching
 */
module.exports = function caching(ctx, res, next) {
  var cached = ctx.store(cacheKey);
  if (cached) {
    res.resolve(cached);
    res.done();
  }

  next();

  ctx.store(cacheKey, res.instanceOrComponent());
};
