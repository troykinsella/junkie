"use strict";
/*jshint -W030 */

var chai = require('chai');
var expect = chai.expect;
var testUtil = require('../test-util');

var junkie = require('../../lib/junkie');
var ResolutionError = require('../../lib/ResolutionError');

chai.should();

var A, B, C, D;
var AFactory, BFactory;

describe("factory injector integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  describe("with no deps", function() {

    it('should construct an instance', function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).as.factory();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
    });

    it('should construct instances', function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).as.factory();
      c.register("B", BFactory).as.factory();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);

      result = c.resolve("B");
      result.should.be.an.instanceof(B);
    });

    it('should fail non-function component', function() {
      var c = junkie.newContainer();

      c.register("A", {}).as.factory();

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "Factory injector: Component must be a function: object");
    });
  });

  describe("with one dep", function() {

    it("should inject a type", function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).inject("B").into.factory();
      c.register("B", B);

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(1);
      result._args[0].should.equal(B);
    });

    it("should inject a constructed instance", function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).inject("B").into.factory();
      c.register("B", B).with.constructor();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(1);
      result._args[0].should.be.an.instanceof(B);
    });

    it("should inject a factory-created instance", function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).inject("B").into.factory();
      c.register("B", BFactory).as.factory();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(1);
      result._args[0].should.be.an.instanceof(B);
    });
  });

});
