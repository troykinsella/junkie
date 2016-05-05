"use strict";
/*jshint -W030 */

var chai = require('chai');
var testUtil = require('../test-util');

var junkie = require('../../lib/junkie');
var ResolutionError = require('../../lib/ResolutionError');

chai.should();

var A, B, C, D;
var AFactory, BFactory;

describe("factory method resolver integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  describe("with no deps", function() {

    it("should fail missing factory method", function(done) {
      var c = junkie.newContainer();

      var F = {};

      c.register("A", F)
        .with.factoryMethod("gimme");

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("FactoryMethod resolver: Method not found: gimme");
        done();
      });
    });

    it("should call factory method on type", function() {
      var c = junkie.newContainer();

      var F = {
        gimme: function() {
          return new A();
        }
      };

      c.register("A", F)
        .with.factoryMethod("gimme");

      return c.resolve("A").then(function(a) {
        a.should.be.instanceof(A);
      });
    });

    it("should call factory method on instance", function() {
      var c = junkie.newContainer();

      var F = function() {
        this.gimme = function() {
          return new A();
        };
      };

      c.register("A", F)
        .with.constructor()
        .with.factoryMethod("gimme");

      return c.resolve("A").then(function(a) {
        a.should.be.instanceof(A);
      });
    });

    it('should chain factory-method-created promise resolve', function() {
      var c = junkie.newContainer();

      var F = {
        gimme: function() {
          return Promise.resolve(new A());
        }
      };

      c.register("A", F)
        .with.factoryMethod("gimme");

      return c.resolve("A").then(function(a) {
        a.should.be.instanceof(A);
      });
    });

    it('should chain factory-method-created promise reject', function(done) {
      var c = junkie.newContainer();

      var F = {
        gimme: function() {
          return Promise.reject(new Error("oh noo"));
        }
      };

      c.register("A", F)
        .with.factoryMethod("gimme");

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(Error);
        err.message.should.equal("oh noo");
        done();
      });
    });

    it("should fail a missing dep", function(done) {
      var c = junkie.newContainer();

      var F = {
        gimme: function(arg) {
          return new A(arg);
        }
      };

      c.register("A", F)
        .with.factoryMethod("gimme", "B");

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(ResolutionError);
        err.message.should.equal("Not found: B");
        done();
      });
    });
  });


  describe("with deps", function() {

    it("should call factory method on type", function() {
      var c = junkie.newContainer();

      var F = {
        gimme: function(arg) {
          return new A(arg);
        }
      };

      c.register("A", F)
        .with.factoryMethod("gimme", "B");
      c.register("B", B);

      return c.resolve("A").then(function(a) {
        a.should.be.instanceof(A);
        a._args.should.deep.equal([ B ]);
      });
    });

    it("should call factory method on instance", function() {
      var c = junkie.newContainer();

      var F = function() {
        this.gimme = function(arg) {
          return new A(arg);
        };
      };

      c.register("A", F)
        .with.constructor()
        .with.factoryMethod("gimme", "B");
      c.register("B", B);

      return c.resolve("A")
        .then(function(a) {
          a.should.be.instanceof(A);
        });
    });



    it("should fail when factory method throws an error", function(done) {
      var c = junkie.newContainer();

      var F = {
        gimme: function() {
          throw new Error("Uh oh")
        }
      };

      c.register("A", F)
        .with.factoryMethod("gimme", "B");
      c.register("B", B);

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(Error);
        err.message.should.equal("Uh oh");
        done();
      });
    });
  });
});
