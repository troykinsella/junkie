"use strict";
/*jshint -W030 */

var chai = require('chai');
var expect = chai.expect;
var testUtil = require('../test-util');

var junkie = require('../../lib/junkie');

chai.should();

var A, B, C, D;
var AFactory, BFactory;

describe("decorator resolver integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  it("should fail with no arguments", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.constructor().with.decorator();

    expect(function() {
      c.resolve("A");
    }).to.throw(Error, "decorator resolver requires argument of string dependency key or factory function");
  });

  it("should fail with missing factory dep", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.constructor().with.decorator("BFactory");

    expect(function() {
      c.resolve("A");
    }).to.throw(Error, "Not found: BFactory");
  });

  it("should fail when decorator factory returns nothing", function() {
    var c = junkie.newContainer();

    function DuhFactory() {}
    c.register("A", A).with.constructor().and.decorator(DuhFactory);

    expect(function() {
      c.resolve("A");
    }).to.throw(Error, "decorator factory did not return instance when resolving: A");
  });

  it("should wrap another instance with factory dep key", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.constructor().and.decorator("BFactory");
    c.register("BFactory", BFactory);

    var a = c.resolve("A");
    a.should.be.an.instanceof(B);
    a._args.length.should.equal(1);
    a._args[0].should.be.an.instanceof(A);
  });

  it("should wrap another type with factory dep key", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.decorator("BFactory");
    c.register("BFactory", BFactory);

    var a = c.resolve("A");
    a.should.be.an.instanceof(B);
    a._args.length.should.equal(1);
    a._args[0].should.equal(A);
  });

  it("should wrap another instance with factory function", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.constructor().and.decorator(BFactory);

    var a = c.resolve("A");
    a.should.be.an.instanceof(B);
    a._args.length.should.equal(1);
    a._args[0].should.be.an.instanceof(A);
  });

  it("should wrap another type with factory function", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.decorator(BFactory);

    var a = c.resolve("A");
    a.should.be.an.instanceof(B);
    a._args.length.should.equal(1);
    a._args[0].should.equal(A);
  });

  it("should have a working README.md documentation", function() {
    var container = junkie.newContainer();

    function Type() {
      this._privateField = "hi";
      this.hi = function() {
        return this._privateField;
      };
    }
    function HidePrivatesDecorator(instance) {
      return {
        hi: instance.hi.bind(instance)
      };
    }

    /*container.register("Type", Type)
      .with.constructor()
      .and.decorator("MyDecorator");
    container.register("MyDecorator", HidePrivatesDecorator);*/

    // - alternatively -

    container.register("Type", Type)
      .with.constructor()
      .and.decorator(HidePrivatesDecorator);

    var t = container.resolve("Type");
    t.hi(); // -> "hi"
    t.hi().should.equal("hi");
    t._privateField; // -> undefined
    expect(t._privateField).to.be.undefined;
  });

});
