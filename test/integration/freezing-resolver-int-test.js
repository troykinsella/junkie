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

describe("freezing resolver integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  it("should freeze the resolved instance", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.constructor().and.freezing();

    var a = c.resolve("A");
    a.should.be.an.instanceof(A);

    // Test for both strict and non-strict mode:
    var threwUp = false;
    try {
      a.something = true;
    } catch (e) {
      threwUp = true;
      e.message.should.equal("Can\'t add property something, object is not extensible");
    }

    if (!threwUp) {
      expect(a.something).to.be.undefined;
    }
  });

  it("should fail to freeze undefined instance", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.freezing();

    expect(function() {
      c.resolve("A");
    }).to.throw(ResolutionError, "Resolver requires instance to be resolved");
  });

  it("should fail to freeze component", function() {
    var c = junkie.newContainer();

    c.register("A", A).use(function(ctx, res, next) {
      res.resolve(ctx.component());
      next();
    }).with.freezing();

    expect(function() {
      c.resolve("A");
    }).to.throw(ResolutionError, "freezing resolver cannot freeze the component itself, only instances");
  });

});
