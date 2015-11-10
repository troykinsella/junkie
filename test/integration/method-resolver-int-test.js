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

    it("should call a method", function() {
      var c = junkie.newContainer();

      var Type = {
        set: function() {
          this._set = Array.prototype.slice.apply(arguments);
        }
      };

      c.register("A", Type).with.method("set");

      var result = c.resolve("A");
      result.should.equal(Type);
      result._set.should.deep.equal([]);
    });

  });

  describe("with one dep", function() {

    it("should inject a type", function() {
      var c = junkie.newContainer();

      var Type = {
        set: function() {
          this._set = Array.prototype.slice.apply(arguments);
        }
      };

      c.register("A", Type).with.method("set", "B");
      c.register("B", B);

      var result = c.resolve("A");
      result.should.equal(Type);
      result._set.should.deep.equal([B]);
    });

    it("should inject a type into an instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.method("set", "B");
      c.register("B", B);

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(0);
      result._set.should.deep.equal([B]);
    });

    it("should inject a constructed instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.method("set", "B");
      c.register("B", B).with.constructor();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(0);
      result._set[0].should.be.instanceof(B);
    });

    it("should inject a factory-created instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.method("set", "B");
      c.register("B", BFactory).as.factory();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(0);
      result._set[0].should.be.instanceof(B);
    });

    it("should fail when method not found", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().and.method("nope", "B");
      c.register("B", B).with.constructor();

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "Method not found: nope");
    });
  });

});
