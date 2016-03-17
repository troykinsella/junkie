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

describe("creator resolver integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  it("should create an instance", function(done) {
    var c = junkie.newContainer();

    var A = {
      foo: function() {
        this.args = Array.prototype.slice.call(arguments);
      }
    };

    c.register("A", A).as.creator();

    return c.resolve("A")
      .then(function(result) {
        // Long way of doing instanceof:
        result.should.not.equal(A);
        result.foo.should.be.a.function;
        result.foo("bar");
        result.args.should.deep.equal([ "bar" ]);
        expect(A.args).to.be.undefined;
        done();
      });
  });

  it("should create separate instances", function() {
    var c = junkie.newContainer();

    var A = {};
    c.register("A", A).as.creator();

    return Promise.all([ c.resolve("A"), c.resolve("A") ]).then(function(As) {
      As[0].should.not.equal(As[1]);
    });
  });

  it("should fail with a non-object prototype", function(done) {
    var c = junkie.newContainer();

    c.register("A", A).with.creator();

    c.resolve("A").catch(function(err) {
      err.should.be.an.instanceof(ResolutionError);
      err.message.should.equal("creator resolver component must be an object");
      done();
    });
  });

  it("should fail non-object properties", function(done) {
    var c = junkie.newContainer();

    var A = {};

    c.register("A", A).with.creator("nope");

    c.resolve("A").catch(function(err) {
      err.should.be.an.instanceof(ResolutionError);
      err.message.should.equal("Not found: nope");
      done();
    });
  });

  it("should fail multiple creator resolvers", function(done) {
    var c = junkie.newContainer();

    var A = {};

    c.register("A", A)
      .with.creator()
      .and.creator();

    c.resolve("A").catch(function(err) {
      err.should.be.an.instanceof(Error);
      err.message.should.equal("Resolver requires instance to not yet be resolved");
      done();
    });
  });

  it("should apply a properties object argument", function() {
    var c = junkie.newContainer();

    var A = {};
    var props = {
      foo: {
        get: function() {
          return "bar";
        }
      }
    };

    c.register("A", A).with.creator(props);

    return c.resolve("A").then(function(a) {
      a.foo.should.equal("bar");
    });
  });

  it("should apply a properties dependency key argument", function() {
    var c = junkie.newContainer();

    var A = {};
    var props = {
      foo: {
        get: function() {
          return "bar";
        }
      }
    };

    c.register("A", A).with.creator("props");
    c.register("props", props);

    return c.resolve("A")
      .then(function(a) {
        a.foo.should.equal("bar");
      });
  });

});
