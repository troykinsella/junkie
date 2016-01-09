"use strict";
/*jshint -W030 */

var chai = require('chai');
var expect = chai.expect;
var Container = require('../../lib/Container');

chai.should();

describe("container", function() {

  describe("#parent", function() {

    it("should return null with no parent", function() {
      var c = new Container();
      expect(c.parent()).to.be.null;
    });

    it("should return a parent instance", function() {
      var p = new Container();
      var c = p.newChild();
      c.parent().should.equal(p);
    });
  });

  describe("#register", function() {

    it("should fail with no key", function() {
      var c = new Container();

      expect(function() {
        c.register();
      }).throw(Error, "key must be a string");
    });

    it("should fail with undefined key", function() {
      var c = new Container();
      var A = function() {};

      expect(function() {
        c.register(undefined, A);
      }).throw(Error, "key must be a string");
    });

    it("should fail with null key", function() {
      var c = new Container();
      var A = function() {};

      expect(function() {
        c.register(null, A);
      }).throw(Error, "key must be a string");
    });

    it("should fail with no component", function() {
      var c = new Container();

      expect(function() {
        c.register("A");
      }).throw(Error, "component must be defined");
    });

    it("should fail with undefined component", function() {
      var c = new Container();

      expect(function() {
        c.register("A", undefined);
      }).throw(Error, "component must be defined");
    });

    it("should allow null component", function() {
      var c = new Container();
      c.register("A", null);
    });

    it("should return builder interface", function() {
      var c = new Container();
      var A = function() {};

      var comp = c.register("A", A);

      comp.with.should.be.a('function');
      comp.use.should.be.a('function');
      comp.as.should.be.a('function');
      comp.and.should.be.a('function');
    });

  });

  describe("#resolve", function() {

    it("should fail with no key", function() {
      var c = new Container();

      expect(function() {
        c.resolve();
      }).to.throw(Error);
    });

    it("should fail with null key", function() {
      var c = new Container();

      expect(function() {
        c.resolve(null);
      }).to.throw(Error);
    });

    it("should fail when C not found and no parent container", function() {
      var c = new Container();

      expect(function() {
        c.resolve("A");
      }).to.throw(Error);
    });

    it("should resolve function", function() {
      var c = new Container();

      function A() {}
      c.register("A", A);

      var result = c.resolve("A");
      result.should.equal(A);
    });

    it("should resolve object", function() {
      var c = new Container();

      function A() {}
      var a = new A();
      c.register("A", a);

      var result = c.resolve("A");
      result.should.equal(a);
    });

    it("should resolve array", function() {
      var c = new Container();

      c.register("A", [ 123 ]);

      var result = c.resolve("A");
      result.should.deep.equal([ 123 ]);
    });

    it("should resolve string", function() {
      var c = new Container();

      c.register("A", "wtf");

      var result = c.resolve("A");
      result.should.equal("wtf");
    });

    it("should resolve number", function() {
      var c = new Container();

      c.register("A", 123);

      var result = c.resolve("A");
      result.should.equal(123);
    });

    it("should resolve boolean", function() {
      var c = new Container();

      c.register("A", false);

      var result = c.resolve("A");
      result.should.be.false;
    });

    it("should resolve regexp", function() {
      var c = new Container();

      c.register("A", /re/);

      var result = c.resolve("A");
      result.test("re").should.be.true;
    });

    it('should resolve null for optional when missing', function() {
      var c = new Container();
      expect(c.resolve("B", { optional: true })).to.be.null;
    });

    it('should resolve null for optional when registered', function() {
      var c = new Container();

      c.register("A", null);

      expect(c.resolve("B", { optional: true })).to.be.null;
    });


  });

  describe("#keys", function() {

    it("should return empty array", function() {
      var c = new Container();
      c.keys().should.deep.equal([]);
    });

    it("should return populated array", function() {
      var c = new Container();

      c.register("A", 1);
      c.register("B", 2);

      c.keys().should.deep.equal(["A", "B"]);
    });

    it("should return container-scoped keys", function() {
      var parent = new Container();
      var child = parent.newChild();

      parent.register("A", 1);
      child.register("B", 2);

      parent.keys().should.deep.equal(["A"]);
      child.keys().should.deep.equal(["B"]);
    });

    it("should return container- and parent-scoped keys", function() {
      var parent = new Container();
      var child = parent.newChild();

      parent.register("A", 1);
      child.register("B", 2);

      parent.keys(true).should.deep.equal(["A"]);
      child.keys(true).should.deep.equal(["A", "B"]);
    });
  });

});
