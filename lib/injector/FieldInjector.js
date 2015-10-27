
module.exports = function constructorInjector(res, next) {

  var args = this.descriptor().depsForInjector("field");
  var inst = res.instance();


  next();
};
