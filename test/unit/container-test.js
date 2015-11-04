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

    it("should fail with null component", function() {
      var c = new Container();

      expect(function() {
        c.register("A", null);
      }).throw(Error, "component must be defined");
    });

    it("should return component interface", function() {
      var c = new Container();
      var A = function() {};

      var comp = c.register("A", A);

      comp.with.should.be.a('function');
      comp.as.should.be.a('function');
      comp.inject.should.be.a('function');
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

  });

});
