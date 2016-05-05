"use strict";
/*jshint -W030 */

var chai = require('chai');
var testUtil = require('../test-util');

var junkie = require('../../lib/junkie');
var ResolutionError = require('../../lib/ResolutionError');

chai.should();

var A, B, C, D;
var AFactory, BFactory;

describe("factory resolver integration", function() {

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

      return c.resolve("A").then(function(result) {
        result.should.be.an.instanceof(A);
      });
    });

    it('should construct instances', function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).as.factory();
      c.register("B", BFactory).as.factory();

      return Promise.all([ c.resolve("A"), c.resolve("B") ]).then(function(results) {
        results[0].should.be.an.instanceof(A);
        results[1].should.be.an.instanceof(B);
      });
    });

    it('should fail non-function component', function(done) {
      var c = junkie.newContainer();

      c.register("A", {}).as.factory();

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("Factory resolver: Component must be a function: object");
        done();
      });
    });

    it('should chain factory-created promise resolve', function() {
      var c = junkie.newContainer();

      c.register("A", function() {
        return Promise.resolve("aw yeah");
      }).as.factory();

      return c.resolve("A").then(function(a) {
        a.should.equal("aw yeah");
      });
    });

    it('should chain factory-crated promise reject', function(done) {
      var c = junkie.newContainer();

      c.register("A", function() {
        return Promise.reject(new Error("oh noo"));
      }).as.factory();

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(Error);
        err.message.should.equal("oh noo");
        done();
      });
    });

    it("should fail a missing dep", function(done) {
      var c = junkie.newContainer();

      c.register("A", A).as.factory("B");

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("Not found: B");
        done();
      });
    });
  });

  describe("with one dep", function() {

    it("should inject a type", function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).as.factory("B");
      c.register("B", B);

      return c.resolve("A").then(function(result) {
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(1);
        result._args[0].should.equal(B);
      });
    });

    it("should inject a constructed instance", function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).as.factory("B");
      c.register("B", B).with.constructor();

      return c.resolve("A")
        .then(function(result) {
          result.should.be.an.instanceof(A);
          result._args.length.should.equal(1);
          result._args[0].should.be.an.instanceof(B);
        });
    });

    it("should inject a factory-created instance", function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).as.factory("B");
      c.register("B", BFactory).as.factory();

      return c.resolve("A").then(function(result) {
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(1);
        result._args[0].should.be.an.instanceof(B);
      });
    });

    it("should resolve a promise result", function() {
      var c = junkie.newContainer();

      c.register("A", function() {
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve(123);
          }, 500);
        });
      }).as.factory();

      return c.resolve("A").then(function(result) {
        result.should.equal(123);
      });
    });

    it("should fail when factory throws an error", function(done) {
      var c = junkie.newContainer();

      c.register("A", function() {
        throw new Error("Uh oh");
      }).as.factory();

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(Error);
        err.message.should.equal("Uh oh");
        done();
      });
    });
  });

});
