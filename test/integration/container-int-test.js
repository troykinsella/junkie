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

      return c.resolve("A", { optional: true })
        .then(function(result) {
          expect(result).to.be.null;
        });
    });

  });

  describe("failed resolves", function() {

    it('should throw the passed error', function(done) {
      var c = junkie.newContainer();

      c.register("A", A).use(function(ctx, res) {
        res.fail(new Error("wtf"));
      });

      c.resolve("A").catch(function(err) {
        err.should.be.an.instanceof(Error);
        err.message.should.equal("wtf");
        done();
      });
    });

  });

  describe("misconfigured resolvers", function() {

    it("should fail with resolver chain that does not resolve", function(done) {
      var c = junkie.newContainer();

      c.register("A", A).use(function(ctx, res) {
        /* Doesn't resolve anything */
      });

      c.resolve("A")
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

      return Promise.all([ c.resolve("A"), c.resolve("A") ])
        .then(function(As) {
          As[0].should.equal(As[1]);
        });
    });

    it("should resolve the same instance", function() {
      var c = junkie.newContainer();

      var a = new A();
      c.register("A", a);

      return Promise.all([ c.resolve("A"), c.resolve("A") ])
        .then(function(As) {
          As[0].should.equal(As[1]);
        });
    });

    it("should resolve the same string", function() {
      var c = junkie.newContainer();

      c.register("A", "wtf");

      return Promise.all([ c.resolve("A"), c.resolve("A") ])
        .then(function(As) {
          As[0].should.equal(As[1]);
        });
    });

    it("should resolve different constructed instances", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor();

      return Promise.all([ c.resolve("A"), c.resolve("A") ])
        .then(function(As) {
          As[0].should.not.equal(As[1]);
        });
    });

    it("should resolve different factory-created instances", function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).as.factory();

      return Promise.all([ c.resolve("A"), c.resolve("A") ])
        .then(function(As) {
          As[0].should.not.equal(As[1]);
        });
    });

    it("should resolve mixed", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor();
      c.register("B", B);
      c.register("C", "c");

      return Promise.all([ c.resolve("A"), c.resolve("B"), c.resolve("C") ])
        .then(function(results) {
          results[0].should.be.an.instanceof(A);
          results[1].should.equal(B);
          results[2].should.equal("c");
        });
    });
  });

  describe("child container", function() {

    it('should search parent for component', function() {
      var parent = junkie.newContainer();

      parent.register("A", A);

      var child = parent.newChild();
      return child.resolve("A")
        .then(function(instance) {
          instance.should.equal(A);
        });
    });

    it('should override parent container components', function() {
      var grandparent = junkie.newContainer();
      var parent = grandparent.newChild();
      var child = parent.newChild();

      grandparent.register("A", A);
      parent.register("A", B);
      child.register("A", C);

      return Promise.all([
        grandparent.resolve("A"),
        parent.resolve("A"),
        child.resolve("A")
      ]).then(function(results) {
        results[0].should.equal(A);
        results[1].should.equal(B);
        results[2].should.equal(C);
      });
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

      return child.resolve("A").then(function(a1) {
        a1.should.equal(C);
        child.dispose();

        return child.resolve("A").then(function(a2) {
          a2.should.equal(B);
          parent.dispose();

          return child.resolve("A").then(function(a3) {
            a3.should.equal(A);
          });
        });
      });
    });

  });
});
