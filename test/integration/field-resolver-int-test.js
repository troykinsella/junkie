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

describe("field resolver integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  describe("no deps", function() {

    it("should fail", function() {
      var c = junkie.newContainer();

      var Type = {
        field: null
      };

      c.register("A", Type).with.field("field");

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "Field resolver: Must supply exactly one dependency");
    });

  });

  describe("with one dep", function() {

    it("should inject a type", function() {
      var c = junkie.newContainer();

      var Type = {
        field: null
      };

      c.register("A", Type).with.field("field", "B");
      c.register("B", B);

      var result = c.resolve("A");
      result.should.equal(Type);
      result.field.should.equal(B);
    });

    it("should inject a type into an instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.field("field", "B");
      c.register("B", B);

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(0);
      result.field.should.equal(B);
      delete A.field;
    });

    it("should inject a constructed instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.field("field", "B");
      c.register("B", B).with.constructor();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(0);
      result.field.should.be.instanceof(B);
    });

    it("should inject a factory-created instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.field("field", "B");
      c.register("B", BFactory).as.factory();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(0);
      result.field.should.be.instanceof(B);
    });


  });

  describe("with two deps", function() {

    it("should fail", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.field("field", "B", "C");
      c.register("B", B);
      c.register("C", C);

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "Field resolver: Must supply exactly one dependency");
    });

  });

});
