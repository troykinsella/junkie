"use strict";
/*jshint -W030 */

var chai = require('chai');
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

    it("should fail", function(done) {
      var c = junkie.newContainer();

      function Type() {
        this.field = null;
      }

      c.register("A", Type)
        .with.constructor()
        .with.field("field");

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("Field resolver: Must supply exactly one dependency");
        done();
      });
    });

  });

  describe("with one dep", function() {

    it("should fail to mutate component", function(done) {
      var c = junkie.newContainer();

      var Type = {
        field: null
      };

      c.register("A", Type).with.field("field", "B");
      c.register("B", B);

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("Resolver requires instance to be resolved");
        done();
      });
    });

    it("should inject a type", function() {
      var c = junkie.newContainer();

      c.register("A", A)
        .with.constructor()
        .and.field("field", "B");
      c.register("B", B);

      return c.resolve("A").then(function(result) {
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(0);
        result.field.should.equal(B);
      });
    });

    it("should inject a constructed instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.field("field", "B");
      c.register("B", B).with.constructor();

      return c.resolve("A")
        .then(function(result) {
          result.should.be.an.instanceof(A);
          result._args.length.should.equal(0);
          result.field.should.be.instanceof(B);
        });
    });

    it("should inject a factory-created instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.field("field", "B");
      c.register("B", BFactory).as.factory();

      return c.resolve("A").then(function(result) {
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(0);
        result.field.should.be.instanceof(B);
      });
    });

    it("should fail a missing dep", function(done) {
      var c = junkie.newContainer();

      c.register("A", A)
        .with.constructor()
        .and.field("field", "B");

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("Not found: B");
        done();
      });
    });
  });

  describe("with two deps", function() {

    it("should fail", function(done) {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.field("field", "B", "C");
      c.register("B", B);
      c.register("C", C);

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("Field resolver: Must supply exactly one dependency");
        done();
      });
    });

  });

});
