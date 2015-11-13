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

describe("constructor resolver integration", function() {

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

      c.register("A", A).with.constructor();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
    });

    it('should construct instances', function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor();
      c.register("B", B).with.constructor();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);

      result = c.resolve("B");
      result.should.be.an.instanceof(B);
    });

    it("should fail a non-function component", function() {

      var c = junkie.newContainer();

      c.register("A", {}).with.constructor();

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "Constructor resolver: Component must be a function: object");
    });

  });

  describe("with one dep", function() {

    it("should inject a type", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", B);

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(1);
      result._args[0].should.equal(B);
    });

    it("should inject constructed instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", B).with.constructor();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(1);
      result._args[0].should.be.an.instanceof(B);
    });

    it("should inject factory-created instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", BFactory).as.factory();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(1);
      result._args[0].should.be.an.instanceof(B);
    });

  });

  describe("with multiple deps", function() {

    it("should fail multiple constructor resolvers", function() {
      var c = junkie.newContainer();

      c.register("A", A)
        .with.constructor("B")
        .and.constructor("C");
      c.register("B", B);
      c.register("C", C);

      expect(function() {
        c.resolve("A");
      }).to.throw(Error, "Resolver requires instance to be resolved");
    });

  });

  describe("with transitive deps", function() {

    it("should inject into constructors", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", B).with.constructor("C");
      c.register("C", C).with.constructor();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(1);
      result._args[0].should.be.an.instanceof(B);
      result._args[0]._args.length.should.equal(1);
      result._args[0]._args[0].should.be.an.instanceof(C);
    });

  });

  describe("with circular deps", function() {

    function assertResolutionError(c, keys) {
      keys.forEach(function(key) {
        expect(function() {
          c.resolve(key);
        }).to.throw(ResolutionError, "Circular dependency: " + key);
      });
    }

    it("should throw ResolutionError for 1st degree", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", B).with.constructor("A");

      assertResolutionError(c, ["A", "B"]);
    });

    it("should throw ResolutionError for 2nd degree", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", B).with.constructor("C");
      c.register("C", C).with.constructor("A");

      assertResolutionError(c, ["A", "B", "C"]);
    });

    it("should throw ResolutionError for 3rd degree", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", B).with.constructor("C");
      c.register("C", C).with.constructor("D");
      c.register("D", D).with.constructor("A");

      assertResolutionError(c, ["A", "B", "C", "D"]);
    });
  });

});
