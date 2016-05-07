"use strict";

var cacheKey = 'caching_instance';

/**
 * Search the {@link Component#store} for a cached instance of a previously resolved component. If one
 * is found, it is resolved and the resolution is marked as done. Otherwise, the next resolvers are called,
 * and when they complete, the resulting resolved instance is cached such that subsequent resolves will
 * return this instance.
 *
 * @name caching
 * @function
 * @memberOf Resolver:caching#
 */

/**
 * Caches resolved instances so that subsequent resolutions immediately return the cached instance.
 *
 * @function
 * @exports Resolver:caching
 */
module.exports = function caching(ctx, res) {
  var cached = ctx.store(cacheKey);
  if (cached) {
    res.resolve(cached);
    return res.done();
  }

  res.once('committed', function() {
    ctx.store(cacheKey, res.instance());
  });
};
