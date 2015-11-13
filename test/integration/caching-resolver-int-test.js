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

describe("caching resolver integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  describe("with no deps", function() {

    it("should fail with no resolved instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.caching();

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "Resolver requires instance to be resolved");
    });

    it("should cache constructed instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().with.caching();

      var a1 = c.resolve("A");
      var a2 = c.resolve("A");
      a1.should.equal(a2);
    });

    it("should cache factory-resolved instance", function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).as.factory().with.caching();

      var a1 = c.resolve("A");
      var a2 = c.resolve("A");
      a1.should.equal(a2);
    });

  });

  // TODO: with deps
});
