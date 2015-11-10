"use strict";
/*jshint -W030 */

var chai = require('chai');
var testUtil = require('../test-util');

var junkie = require('../../lib/junkie');

chai.should();

var A, B, C, D;
var AFactory, BFactory;

describe("multiple resolvers integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  it("should inject several dependencies", function() {
    var c = junkie.newContainer();

    c.register("A", A)
      .with.constructor("B")
      .and.method("set", "C")
      .and.field("field", "D");
    c.register("B", B);
    c.register("C", C);
    c.register("D", D);

    var result = c.resolve("A");
    result.should.be.an.instanceof(A);
    result._args.should.deep.equal([B]);
    result._set.should.deep.equal([C]);
    result.field.should.equal(D);
  });

});
