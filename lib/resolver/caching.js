"use strict";

var cacheKey = 'cachingResolver_instance';

module.exports = function cachingResolver(res, next) {
  var phase = this.phase();
  if (phase === 'locate') {
    var cached = this.store(cacheKey);
    if (cached) {
      res.resolve(cached);
      res.done();
    }
  } else if (phase === 'after') {
    this.store(cacheKey, res.instance());
  }
  next();
};
