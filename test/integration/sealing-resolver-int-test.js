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

describe("sealing resolver integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  it("should seal the resolved instance", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.constructor().and.sealing();

    var a = c.resolve("A");
    a.should.be.an.instanceof(A);
    Object.isSealed(a).should.be.true;
  });

  it("should fail to seal undefined instance", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.sealing();

    expect(function() {
      c.resolve("A");
    }).to.throw(ResolutionError, "Resolver requires instance to be resolved");
  });

  it("should fail to seal component", function() {
    var c = junkie.newContainer();

    c.register("A", A).use(function(ctx, res, next) {
      res.resolve(ctx.component());
      next();
    }).with.sealing();

    expect(function() {
      c.resolve("A");
    }).to.throw(ResolutionError, "sealing resolver cannot seal the component itself, only instances");
  });

});
