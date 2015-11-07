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

  describe("empty", function() {

    it('should fail resolve', function() {
      var c = junkie.newContainer();

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "Not found: A");
    });

    it('should resolve null for optional', function() {
      var c = junkie.newContainer();
      expect(c.resolve("A", { optional: true })).to.be.null;
    });

  });

  describe("no injector", function() {

    it("should resolve type", function() {
      var c = junkie.newContainer();

      c.register("A", A);

      var result = c.resolve("A");
      result.should.equal(A);
    });

    it("should resolve instance", function() {
      var c = junkie.newContainer();

      var a = new A();
      c.register("A", a);

      var result = c.resolve("A");
      result.should.equal(a);
    });

    it("should resolve string", function() {
      var c = junkie.newContainer();

      c.register("A", "wtf");

      var result = c.resolve("A");
      result.should.equal("wtf");
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

  describe("resolver inheritance", function() {

    it("should use container resolvers applied first", function() {
      var c = junkie.newContainer();
      var stack = [];

      c.use(function(ctx, res, next) {
        stack.push(2);
        next();
      });
      c.use(function(ctx, res, next) {
        stack.push(1);
        next();
      });
      c.register("A", A).use(function(ctx, res, next) {
        stack.push(4);
        next();
      }).use(function(ctx, res, next) {
        stack.push(3);
        next();
      });

      c.resolve("A");
      stack.should.deep.equal([ 1, 2, 3, 4 ]);
    });

    it("should use container resolvers applied last", function() {
      var c = junkie.newContainer();
      var stack = [];

      c.register("A", A).use(function(ctx, res, next) {
        stack.push(4);
        next();
      }).use(function(ctx, res, next) {
        stack.push(3);
        next();
      });
      c.use(function(ctx, res, next) {
        stack.push(2);
        next();
      });
      c.use(function(ctx, res, next) {
        stack.push(1);
        next();
      });

      c.resolve("A");
      stack.should.deep.equal([ 1, 2, 3, 4 ]);
    });

    it("should use parent container resolvers", function() {
      var parent = junkie.newContainer();
      var stack = [];

      parent.use(function(ctx, res, next) {
        stack.push(2);
        next();
      });

      var c = parent.newChild();
      c.use(function(ctx, res, next) {
        stack.push(1);
        next();
      });

      c.register("A", A).use(function(ctx, res, next) {
        stack.push(4);
        next();
      }).use(function(ctx, res, next) {
        stack.push(3);
        next();
      });

      c.resolve("A");
      stack.should.deep.equal([ 1, 2, 3, 4 ]);
    });

    it("should not use parent container resolvers when opted", function() {
      var parent = junkie.newContainer();
      var stack = [];

      parent.use(function(ctx, res, next) {
        stack.push(2);
        next();
      });
      parent.use(function(ctx, res, next) {
        stack.push(1);
        next();
      });

      var c = parent.newChild({ inherit: false });
      c.register("A", A).use(function(ctx, res, next) {
        stack.push(4);
        next();
      }).use(function(ctx, res, next) {
        stack.push(3);
        next();
      });

      c.resolve("A");
      stack.should.deep.equal([ 3, 4 ]);
    });

    it("should not use parent container resolvers added after child created", function() {
      var parent = junkie.newContainer();
      var stack = [];

      var c = parent.newChild();

      parent.use(function(ctx, res, next) {
        stack.push(2);
        next();
      });
      parent.use(function(ctx, res, next) {
        stack.push(1);
        next();
      });

      c.register("A", A).use(function(ctx, res, next) {
        stack.push(4);
        next();
      }).use(function(ctx, res, next) {
        stack.push(3);
        next();
      });

      c.resolve("A");
      stack.should.deep.equal([ 3, 4 ]);
    });

    it("should use grand parent container resolvers", function() {
      var grandParent = junkie.newContainer();
      var stack = [];

      grandParent.use(function(ctx, res, next) {
        stack.push(3);
        next();
      });

      var parent = grandParent.newChild();
      parent.use(function(ctx, res, next) {
        stack.push(2);
        next();
      });

      var c = parent.newChild();
      c.use(function(ctx, res, next) {
        stack.push(1);
        next();
      });

      c.register("A", A).use(function(ctx, res, next) {
        stack.push(5);
        next();
      }).use(function (ctx, res, next) {
        stack.push(4);
        next();
      });

      c.resolve("A");
      stack.should.deep.equal([ 1, 2, 3, 4, 5 ]);
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

    it('should search parent for component', function() {
      var parent = junkie.newContainer();

      parent.register("A", A);

      var child = parent.newChild();
      var instance = child.resolve("A");

      instance.should.equal(A);
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
