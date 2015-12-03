"use strict";
/*jshint -W030 */

var chai = require('chai');
var testUtil = require('../test-util');

var junkie = require('../../lib/junkie');

chai.should();

var A, B, C, D;
var AFactory, BFactory;

describe("resolver inheritance integration", function() {

  beforeEach(function() {
    A = testUtil.createType();
    B = testUtil.createType();
    C = testUtil.createType();
    D = testUtil.createType();

    AFactory = testUtil.createFactory(A);
    BFactory = testUtil.createFactory(B);
  });

  it("should use container resolvers applied first", function() {
    var c = junkie.newContainer();
    var stack = [];

    c.use(function(ctx, res) {
      res.resolve(1);
      stack.push(1);
    });
    c.use(function(ctx, res) {
      stack.push(2);
    });
    c.register("A", A).use(function(ctx, res) {
      stack.push(3);
    }).use(function(ctx, res) {
      stack.push(4);
    });

    c.resolve("A").should.be.one;
    stack.should.deep.equal([ 1, 2, 3, 4 ]);
  });

  it("should use container resolvers applied last", function() {
    var c = junkie.newContainer();
    var stack = [];

    c.register("A", A).use(function(ctx, res) {
      res.resolve(1);
      stack.push(3);
    }).use(function(ctx, res) {
      stack.push(4);
    });
    c.use(function(ctx, res) {
      stack.push(1);
    });
    c.use(function(ctx, res) {
      stack.push(2);
    });

    c.resolve("A").should.be.one;
    stack.should.deep.equal([ 1, 2, 3, 4 ]);
  });

  it("should use parent container resolvers", function() {
    var parent = junkie.newContainer();
    var stack = [];

    parent.use(function(ctx, res) {
      res.resolve(1);
      stack.push(1);
    });

    var c = parent.newChild();
    c.use(function(ctx, res) {
      stack.push(2);
    });

    c.register("A", A).use(function(ctx, res) {
      stack.push(3);
    }).use(function(ctx, res) {
      stack.push(4);
    });

    c.resolve("A").should.be.one;
    stack.should.deep.equal([ 1, 2, 3, 4 ]);
  });

  it("should not use parent container resolvers when opted", function() {
    var parent = junkie.newContainer();
    var stack = [];

    parent.use(function(ctx, res) {
      stack.push(1);
    });
    parent.use(function(ctx, res) {
      stack.push(2);
    });

    var c = parent.newChild({ inherit: false });
    c.register("A", A).use(function(ctx, res) {
      res.resolve(1);
      stack.push(3);
    }).use(function(ctx, res) {
      stack.push(4);
    });

    c.resolve("A").should.be.one;
    stack.should.deep.equal([ 3, 4 ]);
  });

  it("should not use parent container resolvers added after child created", function() {
    var parent = junkie.newContainer();
    var stack = [];

    var c = parent.newChild();

    parent.use(function(ctx, res) {
      stack.push(1);
    });
    parent.use(function(ctx, res) {
      stack.push(2);
    });

    c.register("A", A).use(function(ctx, res) {
      res.resolve(1);
      stack.push(3);
    }).use(function(ctx, res) {
      stack.push(4);
    });

    c.resolve("A").should.be.one;
    stack.should.deep.equal([ 3, 4 ]);
  });

  it("should use grand parent container resolvers", function() {
    var grandParent = junkie.newContainer();
    var stack = [];

    grandParent.use(function(ctx, res) {
      res.resolve(1);
      stack.push(1);
    });

    var parent = grandParent.newChild();
    parent.use(function(ctx, res) {
      stack.push(2);
    });

    var c = parent.newChild();
    c.use(function(ctx, res) {
      stack.push(3);
    });

    c.register("A", A).use(function(ctx, res) {
      stack.push(4);
    }).use(function (ctx, res) {
      stack.push(5);
    });

    c.resolve("A").should.be.one;
    stack.should.deep.equal([ 1, 2, 3, 4, 5 ]);
  });

});
