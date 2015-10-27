
const chai = require('chai');
chai.should();

const junkie = require('../../lib/junkie');


const A = function() {
  this._imA = "A";
  this._args = Array.prototype.slice.apply(arguments);
};
const B = function() {
  this._imA = "B";
  this._args = Array.prototype.slice.apply(arguments);
};
const C = function() {
  this._imA = "C";
  this._args = Array.prototype.slice.apply(arguments);
};


describe("junkie integration", function() {

  describe("no deps", function() {

    it("should resolve type", function() {
      var c = junkie.newContainer();

      c.register("A", A);

      const result = c.resolve("A");
      result.should.equal(A);
    });

    it("should resolve instance", function() {
      var c = junkie.newContainer();

      const a = new A();
      c.register("A", a);

      const result = c.resolve("A");
      result.should.equal(a);
    });

  });

  describe("constructor injector", function() {

    it('should create an instance', function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor();

      const result = c.resolve("A");
      result.should.be.an.instanceof(A);
    });

    it('should create an instance 2', function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor();
      c.register("B", B).with.constructor();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);

      result = c.resolve("B");
      result.should.be.an.instanceof(B);
    });

  });

  describe("one dep", function() {

    it("should inject a type into constructor", function() {
      var c = junkie.newContainer();

      c.register("A", A).inject("B").into.constructor();
      c.register("B", B);

      const result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args[0].should.equal(B);
    });

    it("should inject an instance into constructor", function() {
      var c = junkie.newContainer();

      c.register("A", A).inject("B").into.constructor();
      c.register("B", B).with.constructor();

      const result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args[0].should.be.an.instanceof(B);
    });


    //c.register(A).inject(B, C, D).into.constructor();
    //c.register(A).inject(B).into.setter("setB");
    //c.register(A).inject(B).into.field("b");
    //c.register(A).as.factory();
    //c.register(A).as.factory().with("caching");
    //c.register(A).inject(B, C, D).as.factory();

  });


});
