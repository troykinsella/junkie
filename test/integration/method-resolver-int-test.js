"use strict";
/*jshint -W030 */

var chai = require('chai');
var testUtil = require('../test-util');

var junkie = require('../../lib/junkie');
var ResolutionError = require('../../lib/ResolutionError');

chai.should();

var A, B, C, D;
var AFactory, BFactory;

describe("method resolver integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  describe("with no deps", function() {

    it("should fail to call on component", function(done) {
      var c = junkie.newContainer();

      var Type = {
        set: function() {
          this._set = Array.prototype.slice.apply(arguments);
        }
      };

      c.register("A", Type).with.method("set");

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("Resolver requires instance to be resolved");
        done();
      });
    });

  });

  describe("with one dep", function() {

    it("should inject a type", function() {
      var c = junkie.newContainer();

      function Type() {
        this.set = function() {
          this._set = Array.prototype.slice.apply(arguments);
        };
      }

      c.register("A", Type)
        .with.constructor()
        .with.method("set", "B");
      c.register("B", B);

      return c.resolve("A").then(function(result) {
        result.should.be.an.instanceof(Type);
        result._set.should.deep.equal([B]);
      });
    });

    it("should inject a type into an instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.method("set", "B");
      c.register("B", B);

      return c.resolve("A").then(function(result) {
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(0);
        result._set.should.deep.equal([B]);
      });
    });

    it("should inject a constructed instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.method("set", "B");
      c.register("B", B).with.constructor();

      return c.resolve("A")
        .then(function(result) {
          result.should.be.an.instanceof(A);
          result._args.length.should.equal(0);
          result._set[0].should.be.instanceof(B);
        });
    });

    it("should inject a factory-created instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.method("set", "B");
      c.register("B", BFactory).as.factory();

      return c.resolve("A").then(function(result) {
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(0);
        result._set[0].should.be.instanceof(B);
      });
    });

    it("should fail when method not found", function(done) {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.method("nope", "B");
      c.register("B", B).with.constructor();

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("Method resolver: Method not found: nope");
        done();
      });
    });

    it("should fail a missing dep", function(done) {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.method("set", "B");

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("Not found: B");
        done();
      });
    });
  });

});
