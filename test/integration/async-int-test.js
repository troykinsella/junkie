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

    c.resolved("A").then(function(inst) {
      inst.should.equal("foo");
      done();
    }).catch(done);
  });

  it("should fail when async resolver called in sync context", function() {
    var c = junkie.newContainer();

    c.register("A", A)
      .use(function (ctx, res, next) {
        process.nextTick(function() {
          res.resolve("foo");
          next();
        });
      });

    expect(function() {
      c.resolve("A");
    }).to.throw(ResolutionError, "Asynchronous-only resolver called in a synchronous context");
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

    c.resolved("A").then(function() {
      done(false); // Shouldn't succeed
    }).catch(function(err) {
      err.message.should.equal("wtf");
      done();
    });
  });

  it("should resolve synchronously when optional sync supported", function() {
    var c = junkie.newContainer();

    var resolver = function(ctx, res, next, async) {
      res.resolve("foo");
      next();
    };

    c.register("A", A)
      .use(resolver);

    var a = c.resolve("A");
    a.should.equal("foo");
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

    c.resolved("A").then(function(num) {
      num.should.equal(3);
      done();
    }).catch(done);
  });

  it("should resolve using sync resolver with async dependency", function(done) {
    var c = junkie.newContainer();

    c.register("A", A)
      .with.constructor("B");

    c.register("B", B)
      .with.constructor()
      .use(function(ctx, res, next) {
        process.nextTick(function() {
          res.instance().foo = "bar";
          next();
        });
      });

    c.resolved("A").then(function(a) {
      a._args[0].should.be.an.instanceof(B);
      done();
    }).catch(done);
  });

});
