"use strict";
/*jshint -W030 */

var chai = require('chai');
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

    return c.resolve("A").then(function(a) {
      a.should.be.an.instanceof(A);
      Object.isSealed(a).should.be.true;
    });
  });

  it("should fail to seal undefined instance", function(done) {
    var c = junkie.newContainer();

    c.register("A", A).with.sealing();

    c.resolve("A").catch(function(err) {
      err.should.be.an.instanceof(ResolutionError);
      err.message.should.equal("Resolver requires instance to be resolved");
      done();
    });
  });

  it("should fail to seal component", function(done) {
    var c = junkie.newContainer();

    c.register("A", A).use(function(ctx, res) {
      res.resolve(ctx.component());
    }).with.sealing();

    c.resolve("A").catch(function(err) {
      err.should.be.an.instanceof(ResolutionError);
      err.message.should.equal("sealing resolver cannot seal the component itself, only instances");
      done();
    });
  });

});
