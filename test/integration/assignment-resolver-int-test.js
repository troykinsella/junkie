"use strict";
/*jshint -W030 */

var chai = require('chai');
var testUtil = require('../test-util');

var junkie = require('../../lib/junkie');
var ResolutionError = require('../../lib/ResolutionError');

chai.should();

var A, B, C, D;
var AFactory, BFactory;

describe("assignment resolver integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  it("should assign to resolved instance", function() {
    var c = junkie.newContainer();

    B = {
      b: function() {
        return "yep";
      }
    };

    c.register("A", A)
      .with.constructor()
      .and.assignment("B");
    c.register("B", B);

    return c.resolve("A")
      .then(function(a) {
        a.should.be.an.instanceof(A);
        a.b.should.be.a.function;
        a.b().should.equal("yep");
      });
  });

  it("should fail a missing prototype dep", function(done) {
    var c = junkie.newContainer();

    c.register("A", A)
      .with.constructor()
      .and.assignment("B");

    c.resolve("A").catch(function(err) {
      err.should.be.an.instanceof(ResolutionError);
      err.message.should.equal("Not found: B");
      done();
    });
  });
});
