
function Resolver(impl) {
  if (typeof impl === 'function') {
    var fn = impl;
    impl = {};
    Object.keys(Resolver.Phase).forEach(function(phase) {
      impl[phase] = fn;
    });
  }

  this._phases = impl;
}

Resolver.Phase = Object.freeze({
  "before": "before",
  "locate": "locate",
  "instantiate": "instantiate",
  "configure": "configure",
  "after": "after"
});

const R = Resolver.prototype;

R.resolve = function(ctx, res, next) {
  var f = this._phases[ctx.phase()];

  //console.log("Resolver#resolve", ctx.phase(), f);

  if (!f) {
    return next();
  }

  try {
    f.call(ctx, res, next);
  } catch (e) {
    res.fail(e);
    return next();
  }
};

module.exports = Resolver;
