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


  it("should create an instance", function() {
    var c = junkie.newContainer();

    var A = {
      foo: function() {
        this.args = Array.prototype.slice.call(arguments);
      }
    };

    c.register("A", A).as.creator();

    var result = c.resolve("A");

    // Long way of doing instanceof:
    result.should.not.equal(A);
    result.foo.should.be.a.function;
    result.foo("bar");
    result.args.should.deep.equal([ "bar" ]);
    expect(A.args).to.be.undefined;
  });

  it("should async create an instance", function(done) {
    var c = junkie.newContainer();

    var A = {
      foo: function() {
        this.args = Array.prototype.slice.call(arguments);
      }
    };

    c.register("A", A).as.creator();

    c.resolved("A")
      .then(function(result) {
        // Long way of doing instanceof:
        result.should.not.equal(A);
        result.foo.should.be.a.function;
        result.foo("bar");
        result.args.should.deep.equal([ "bar" ]);
        expect(A.args).to.be.undefined;
        done();
      })
      .catch(done);
  });

  it("should create separate instances", function() {
    var c = junkie.newContainer();

    var A = {};
    c.register("A", A).as.creator();

    var a1 = c.resolve("A");
    var a2 = c.resolve("A");
    a1.should.not.equal(a2);
  });

  it("should fail with a non-object prototype", function() {
    var c = junkie.newContainer();

    c.register("A", A).with.creator();

    expect(function() {
      c.resolve("A");
    }).to.throw(ResolutionError, "creator resolver component must be an object");
  });

  it("should fail non-object properties", function() {
    var c = junkie.newContainer();

    var A = {};

    c.register("A", A).with.creator("nope");

    expect(function() {
      c.resolve("A");
    }).to.throw(ResolutionError, "Not found: nope");
  });

  it("should fail multiple creator resolvers", function() {
    var c = junkie.newContainer();

    var A = {};

    c.register("A", A)
      .with.creator()
      .and.creator();

    expect(function() {
      c.resolve("A");
    }).to.throw(Error, "Resolver requires instance to not yet be resolved");
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

    var a = c.resolve("A");
    a.foo.should.equal("bar");
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

    var a = c.resolve("A");
    a.foo.should.equal("bar");
  });


  it("should async apply a properties dependency key argument", function(done) {
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

    c.resolved("A")
      .then(function(a) {
        a.foo.should.equal("bar");
        done();
      })
      .catch(done);
  });

});
