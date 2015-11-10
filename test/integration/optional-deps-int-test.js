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

describe("optional dependencies integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  it("should inject null when dependency missing", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.constructor("B?");

    var result = c.resolve("A");
    result.should.be.an.instanceof(A);
    result._args.should.deep.equal([ null ]);
  });

  it("should inject nulls when dependencies missing", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.constructor("B?", "C?");

    var result = c.resolve("A");
    result.should.be.an.instanceof(A);
    result._args.should.deep.equal([ null, null ]);
  });

  it("should still require non-optional dependencies", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.constructor("B", "C?");

    expect(function() {
      c.resolve("A");
    }).to.throw(ResolutionError, "Not found: B");
  });

});
