"use strict";
/*jshint -W030 */

var chai = require('chai');
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

    return c.resolve("A").then(function(a) {
      a.should.be.an.instanceof(A);
      Object.isFrozen(a).should.be.true;
    });
  });

  it("should fail to freeze undefined instance", function(done) {
    var c = junkie.newContainer();

    c.register("A", A).with.freezing();

    c.resolve("A").catch(function(err) {
      err.should.be.an.instanceof(ResolutionError);
      err.message.should.equal("Resolver requires instance to be resolved");
      done();
    });
  });

  it("should fail to freeze component", function(done) {
    var c = junkie.newContainer();

    c.register("A", A).use(function(ctx, res) {
      res.resolve(ctx.component());
    }).with.freezing();

    c.resolve("A").catch(function(err) {
      err.should.be.an.instanceof(ResolutionError);
      err.message.should.equal("freezing resolver cannot freeze the component itself, only instances");
      done();
    });
  });

});
