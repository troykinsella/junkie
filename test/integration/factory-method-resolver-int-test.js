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

describe("factory method resolver integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  describe("with no deps", function() {

    it("should fail missing factory method", function() {
      var c = junkie.newContainer();

      var F = {};

      c.register("A", F)
        .with.factoryMethod("gimme");

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "FactoryMethod resolver: Method not found: gimme");

    });

    it("should call factory method on type", function() {
      var c = junkie.newContainer();

      var F = {
        gimme: function() {
          return new A();
        }
      };

      c.register("A", F)
        .with.factoryMethod("gimme");

      var a = c.resolve("A");
      a.should.be.instanceof(A);
    });

    it("should call factory method on instance", function() {
      var c = junkie.newContainer();

      var F = function() {
        this.gimme = function() {
          return new A();
        };
      };

      c.register("A", F)
        .with.constructor()
        .with.factoryMethod("gimme");

      var a = c.resolve("A");
      a.should.be.instanceof(A);
    });

  });


  describe("with deps", function() {

    it("should call factory method on type", function() {
      var c = junkie.newContainer();

      var F = {
        gimme: function(arg) {
          return new A(arg);
        }
      };

      c.register("A", F)
        .with.factoryMethod("gimme", "B");
      c.register("B", B);

      var a = c.resolve("A");
      a.should.be.instanceof(A);
      a._args.should.deep.equal([ B ]);
    });

    it("should call factory method on instance", function() {
      var c = junkie.newContainer();

      var F = function() {
        this.gimme = function(arg) {
          return new A(arg);
        };
      };

      c.register("A", F)
        .with.constructor()
        .with.factoryMethod("gimme", "B");
      c.register("B", B);

      var a = c.resolve("A");
      a.should.be.instanceof(A);
    });

    it("should async call factory method on instance", function(done) {
      var c = junkie.newContainer();

      var F = function() {
        this.gimme = function(arg) {
          return new A(arg);
        };
      };

      c.register("A", F)
        .with.constructor()
        .with.factoryMethod("gimme", "B");
      c.register("B", B);

      c.resolved("A")
        .then(function(a) {
          a.should.be.instanceof(A);
          done();
        })
        .catch(done);
    });

  });
});
