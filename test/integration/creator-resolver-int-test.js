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

describe("creator resolver integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  describe("with no deps", function() {

    it("should create an instance with no initializer", function() {
      var c = junkie.newContainer();

      var AnA = {
        field: true
      };

      c.register("A", AnA).as.creator();

      var result = c.resolve("A");
      result.field.should.be.true;
    });

    it("should create separate instances with no initializer", function() {
      var c = junkie.newContainer();

      var AnA = {
        field: true
      };

      c.register("A", AnA).as.creator();

      var a1 = c.resolve("A");
      var a2 = c.resolve("A");
      a1.field.should.be.true;
      a2.field.should.be.true;
      a1.should.not.equal(a2);
    });

    it("should create an instance with initializer", function() {
      var c = junkie.newContainer();

      var AnA = {
        init: function() {
          this._args = Array.prototype.slice.apply(arguments);
        }
      };

      c.register("A", AnA).with.creator("init");

      var result = c.resolve("A");
      result._args.should.deep.equal([]);
    });

    it("should fail missing initalizer", function() {
      var c = junkie.newContainer();

      var AnA = {};

      c.register("A", AnA).with.creator("init");

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "Initializer function not found: init");
    });

    it("should fail non-function initalizer", function() {
      var c = junkie.newContainer();

      var AnA = {
        init: "wtf"
      };

      c.register("A", AnA).with.creator("init");

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "Initializer function not found: init");
    });

  });

  describe("with one dep", function() {

    it("should create an instance with initializer", function() {
      var c = junkie.newContainer();

      var AnA = {
        init: function() {
          this._args = Array.prototype.slice.apply(arguments);
        }
      };

      c.register("A", AnA).with.creator("init", "B");
      c.register("B", B);

      var result = c.resolve("A");
      result._args.should.deep.equal([B]);
    });

    it("should fail no initalizer method", function() {
      var c = junkie.newContainer();

      var AnA = {};

      c.register("A", AnA).with.creator("B");
      c.register("B", B);

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "Creator resolver: Initializer function not found: B");
    });

  });

  describe("with multiple deps", function() {

    it("should fail multiple constructor resolvers", function() {
      var c = junkie.newContainer();

      var AnA = {
        init: function() {
          this._args = Array.prototype.slice.apply(arguments);
        }
      };

      c.register("A", AnA)
        .with.creator("init", "B")
        .and.creator("init", "C");
      c.register("B", B);
      c.register("C", C);

      expect(function() {
        c.resolve("A");
      }).to.throw(Error, "Resolver requires instance to be resolved");
    });

  });
});
