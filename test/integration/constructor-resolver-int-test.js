"use strict";
/*jshint -W030 */

var chai = require('chai');
var testUtil = require('../test-util');

var junkie = require('../../lib/junkie');
var ResolutionError = require('../../lib/ResolutionError');

chai.should();

var A, B, C, D;
var AFactory, BFactory;

function range(start, count) {
  return Array.apply(0, Array(count))
    .map(function (element, index) {
      return index + start;
    });
}

describe("constructor resolver integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  it('should pass a reasonable number of constructor arguments', function() {
    var j;
    var cases = [];

    range(0, 11).forEach(function(i) {
      var c = junkie.newContainer();
      var builder = c.register("A", A);
      var args = [];
      var actual = [];
      for (j = 0; j < i; j++) {
        args.push("B");
        actual.push(B);
      }
      builder.with.constructor.apply(null, args);

      c.register("B", B);

      cases.push(c.resolve("A").then(function(a) {
        a._args.should.deep.equal(actual);
      }));
    });

    return Promise.all(cases);
  });

  it('should reject an unreasonable number of constructor arguments', function(done) {
    var c = junkie.newContainer();
    var builder = c.register("A", A);
    var args = [];
    var actual = [];
    for (var i = 0; i <= 11; i++) {
      args.push("B");
      actual.push(B);
    }
    builder.with.constructor.apply(null, args);

    c.register("B", B);

    c.resolve("A").catch(function(err) {
      err.should.be.an.instanceof(Error);
      done();
    });
  });

  describe("with no deps", function() {

    it('should construct an instance', function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor();

      return c.resolve("A").then(function(result) {
        result.should.be.an.instanceof(A);
      });
    });

    it('should construct instances', function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor();
      c.register("B", B).with.constructor();

      return Promise.all([ c.resolve("A"), c.resolve("B") ]).then(function(results) {
        results[0].should.be.an.instanceof(A);
        results[1].should.be.an.instanceof(B);
      });
    });

    it("should fail a non-function component", function(done) {

      var c = junkie.newContainer();

      c.register("A", {}).with.constructor();

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("Constructor resolver: Component must be a function: object");
        done();
      });
    });

  });

  describe("with one dep", function() {

    it("should inject a type", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", B);

      return c.resolve("A")
        .then(function(result) {
          result.should.be.an.instanceof(A);
          result._args.length.should.equal(1);
          result._args[0].should.equal(B);
        });
    });

    it("should inject constructed instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", B).with.constructor();

      return c.resolve("A").then(function(result) {
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(1);
        result._args[0].should.be.an.instanceof(B);
      });
    });

    it("should inject factory-created instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", BFactory).as.factory();

      return c.resolve("A").then(function(result) {
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(1);
        result._args[0].should.be.an.instanceof(B);
      });
    });

  });

  describe("with multiple deps", function() {

    it("should fail multiple constructor resolvers", function(done) {
      var c = junkie.newContainer();

      c.register("A", A)
        .with.constructor("B")
        .and.constructor("C");
      c.register("B", B);
      c.register("C", C);

      c.resolve("A")
        .catch(function(err) {
          err.should.be.instanceof(Error);
          err.message.should.equal("Resolver requires instance to not yet be resolved");
          done();
        });
    });

  });

  describe("with transitive deps", function() {

    it("should inject into constructors", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", B).with.constructor("C");
      c.register("C", C).with.constructor();

      return c.resolve("A")
        .then(function(result) {
          result.should.be.an.instanceof(A);
          result._args.length.should.equal(1);
          result._args[0].should.be.an.instanceof(B);
          result._args[0]._args.length.should.equal(1);
          result._args[0]._args[0].should.be.an.instanceof(C);
        });
    });

  });

  describe("with circular deps", function() {

    function assertResolutionError(c, keys) {

      var promises = [];

      keys.forEach(function(key) {
        promises.push(new Promise(function(resolve, reject) {
          c.resolve(key)
            .then(function() {
              reject(new Error("Circular dep succeeded"));
            })
            .catch(function(err) {
              err.should.be.an.instanceof(ResolutionError);
              err.message.should.equal("Circular dependency: " + key);
              resolve();
            });
        }));
      });

      return Promise.all(promises);
    }

    it("should throw ResolutionError for 1st degree", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", B).with.constructor("A");

      return assertResolutionError(c, ["A", "B"]);
    });

    it("should throw ResolutionError for 2nd degree", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", B).with.constructor("C");
      c.register("C", C).with.constructor("A");

      return assertResolutionError(c, ["A", "B", "C"]);
    });

    it("should throw ResolutionError for 3rd degree", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor("B");
      c.register("B", B).with.constructor("C");
      c.register("C", C).with.constructor("D");
      c.register("D", D).with.constructor("A");

      return assertResolutionError(c, ["A", "B", "C", "D"]);
    });
  });

});
