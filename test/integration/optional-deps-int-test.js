"use strict";
/*jshint -W030 */

var chai = require('chai');
var testUtil = require('../test-util');

var junkie = require('../../lib/junkie');

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

  it("should inject null when dependency missing using optional method", function() {
    var c = junkie.newContainer();

    c.register("A", A).inject.optional("B").into.constructor();

    var result = c.resolve("A");
    result.should.be.an.instanceof(A);
    result._args.should.deep.equal([ null ]);
  });

  it("should inject null when dependency missing using key suffix", function() {
    var c = junkie.newContainer();

    c.register("A", A).inject("B?").into.constructor();

    var result = c.resolve("A");
    result.should.be.an.instanceof(A);
    result._args.should.deep.equal([ null ]);
  });

});
