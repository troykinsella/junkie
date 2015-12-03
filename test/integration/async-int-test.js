"use strict";
/*jshint -W030 */

var chai = require('chai');
var testUtil = require('../test-util');
var junkie = require('../../lib/junkie');

chai.should();

var A, B, C, D;
var AFactory, BFactory;

describe("async integration", function() {

  beforeEach(function () {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  it("should resolve a value later", function(done) {
    var c = junkie.newContainer();

    c.register("A", A)
      .use(function (ctx, res, next) {
        process.nextTick(function() {
          res.resolve("foo");
          next();
        });
      });

    c.resolve("A").then(function(inst) {
      inst.should.equal("foo");
      done();
    }).catch(done);
  });

  it("should fail later", function(done) {
    var c = junkie.newContainer();

    c.register("A", A)
      .use(function(ctx, res, next) {
        process.nextTick(function() {
          res.fail(new Error("wtf"));
          next();
        });
      });

    c.resolve("A").then(function() {
      done(false); // Shouldn't succeed
    }).catch(function(err) {
      err.message.should.equal("wtf");
      done();
    });
  });

  it("should call resolvers in order", function(done) {
    var c = junkie.newContainer();

    c.register("A", A)
      .use(function(ctx, res, next) {
        process.nextTick(function() {
          res.instance(false); // assert nothing resolved yet
          res.resolve(1);
          next();
        });
      })
      .use(function(ctx, res, next) {
        process.nextTick(function() {
          res.instance().should.be.one;
          res.resolve(2);
          next();
        });
      })
      .use(function(ctx, res, next) {
        process.nextTick(function() {
          res.instance().should.equal(2);
          res.resolve(3);
          next();
        });
      });

    c.resolve("A").then(function(num) {
      num.should.equal(3);
      done();
    }).catch(done);
  });

});
