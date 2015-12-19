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

describe("container integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  describe("optional resolves", function() {

    it('should resolve null with resolver that resolves null' /* lol */, function() {
      var c = junkie.newContainer();

      c.register("A", A).use(function(ctx, res) {
        res.resolve(null);
      });

      expect(c.resolve("A", { optional: true })).to.be.null;
    });

    it('should async resolve null with resolver that resolves null' /* lol */, function(done) {
      var c = junkie.newContainer();

      c.register("A", A).use(function(ctx, res) {
        res.resolve(null);
      });

      c.resolved("A", { optional: true })
        .then(function(result) {
          expect(result).to.be.null;
          done();
        })
        .catch(done);
    });

  });

  describe("failed resolves", function() {

    it('should throw the passed error', function() {
      var c = junkie.newContainer();

      c.register("A", A).use(function(ctx, res) {
        res.fail(new Error("wtf"));
      });

      expect(function() {
        c.resolve("A");
      }).to.throw(Error, "wtf");
    });

    it('should throw the passed error', function() {
      var c = junkie.newContainer();

      c.register("A", A).use(function(ctx, res) {
        res.fail(new Error("wtf"));
      });

      expect(function() {
        c.resolve("A");
      }).to.throw(Error, "wtf");
    });
  });

  describe("misconfigured resolvers", function() {

    it("should fail with resolver chain that does not resolve", function() {
      var c = junkie.newContainer();

      c.register("A", A).use(function(ctx, res) {
        /* Doesn't resolve anything */
      });

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "Resolver chain failed to resolve a component instance");
    });

    it("should async fail with resolver chain that does not resolve", function(done) {
      var c = junkie.newContainer();

      c.register("A", A).use(function(ctx, res) {
        /* Doesn't resolve anything */
      });

      c.resolved("A")
        .then(function() {
          done(false);
        })
        .catch(function(err) {
          err.should.be.instanceof(ResolutionError);
          err.message.should.equal("Resolver chain failed to resolve a component instance");
          done();
        });
    });
  });

  describe("multiple resolves", function() {

    it("should resolve the same type", function() {
      var c = junkie.newContainer();

      c.register("A", A);

      var A1 = c.resolve("A");
      var A2 = c.resolve("A");
      A1.should.equal(A2);
    });

    it("should async resolve the same type", function(done) {
      var c = junkie.newContainer();

      c.register("A", A);

      Promise.all([ c.resolved("A"), c.resolved("A") ])
        .then(function(As) {
          As[0].should.equal(As[1]);
          done();
        })
        .catch(done);
    });

    it("should resolve the same instance", function() {
      var c = junkie.newContainer();

      var a = new A();
      c.register("A", a);

      var a1 = c.resolve("A");
      var a2 = c.resolve("A");
      a1.should.equal(a2);
    });

    it("should resolve the same string", function() {
      var c = junkie.newContainer();

      c.register("A", "wtf");

      var a1 = c.resolve("A");
      var a2 = c.resolve("A");
      a1.should.equal(a2);
    });

    it("should resolve different constructed instances", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor();

      var a1 = c.resolve("A");
      var a2 = c.resolve("A");
      a1.should.not.equal(a2);
    });

    it("should resolve different factory-created instances", function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).as.factory();

      var a1 = c.resolve("A");
      var a2 = c.resolve("A");
      a1.should.not.equal(a2);
    });

    it("should resolve mixed", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor();
      c.register("B", B);
      c.register("C", "c");

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);

      result = c.resolve("B");
      result.should.equal(B);

      result = c.resolve("C");
      result.should.equal("c");
    });
  });

  describe("child container", function() {

    it('should search parent for component', function() {
      var parent = junkie.newContainer();

      parent.register("A", A);

      var child = parent.newChild();
      var instance = child.resolve("A");

      instance.should.equal(A);
    });

    it('should async search parent for component', function(done) {
      var parent = junkie.newContainer();

      parent.register("A", A);

      var child = parent.newChild();
      child.resolved("A")
        .then(function(instance) {
          instance.should.equal(A);
          done();
        })
        .catch(done);
    });

    it('should override parent container components', function() {
      var grandparent = junkie.newContainer();
      var parent = grandparent.newChild();
      var child = parent.newChild();

      grandparent.register("A", A);
      parent.register("A", B);
      child.register("A", C);

      grandparent.resolve("A").should.equal(A);
      parent.resolve("A").should.equal(B);
      child.resolve("A").should.equal(C);
    });
  });

  describe("disposed container", function() {

    it('should fail subsequent modifying operations', function() {
      var c = junkie.newContainer();
      c.dispose();

      var msg = "Container disposed";
      expect(c.newChild.bind(c)).to.throw(Error, msg);
      expect(c.use.bind(c)).to.throw(Error, msg);
      expect(c.register.bind(c)).to.throw(Error, msg);
    });

    it('should pass through resolves to parent', function() {
      var grandparent = junkie.newContainer();
      var parent = grandparent.newChild();
      var child = parent.newChild();

      grandparent.register("A", A);
      parent.register("A", B);
      child.register("A", C);

      child.resolve("A").should.equal(C);
      child.dispose();
      child.resolve("A").should.equal(B);
      parent.dispose();
      child.resolve("A").should.equal(A);
    });

  });
});
