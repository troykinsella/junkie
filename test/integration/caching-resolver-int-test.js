"use strict";
/*jshint -W030 */

var chai = require('chai');
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

    it("should fail with no resolved instance", function(done) {
      var c = junkie.newContainer();

      c.register("A", A).with.caching();

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("Resolver chain failed to resolve a component instance");
        done();
      });
    });

    it("should cache constructed instance", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor().with.caching();

      return Promise.all([ c.resolve("A"), c.resolve("A") ]).then(function(As) {
        As[0].should.equal(As[1]);
      });
    });

    it("should cache factory-resolved instance", function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).as.factory().with.caching();

      return Promise.all([ c.resolve("A"), c.resolve("A") ]).then(function(As) {
        As[0].should.equal(As[1]);
      });
    });

  });

  // TODO: with deps
});
