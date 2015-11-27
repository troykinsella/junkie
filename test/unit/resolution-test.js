"use strict";
/*jshint -W030 */

var chai = require('chai');
var expect = chai.expect;

var Resolution = require('../../lib/Resolution');
var ResolutionError = require('../../lib/ResolutionError');

chai.should();

describe("resolution", function() {

  describe("#resolve", function() {

    it("should fail an undefined instance", function() {
      var res = new Resolution();
      expect(function() {
        res.resolve();
      }).to.throw(ResolutionError, "Resolver attempted to resolve undefined instance");
    });

    it("should allow a null", function() {
      var res = new Resolution();
      res.resolve(null);
      expect(res.instance()).to.be.null;
    });

  });

  describe("#instance", function() {

    it("should return undefined with no resolved instance", function() {
      var res = new Resolution();
      expect(res.instance()).to.be.undefined;
    });

    it("should fail with require true and no resolved instance", function() {
      var res = new Resolution();
      expect(function() {
        res.instance(true);
      }).to.throw(ResolutionError, "Resolver requires instance to be resolved");
    });

    it("should fail with require true and resolved null", function() {
      var res = new Resolution();
      res.resolve(null);
      expect(function() {
        res.instance(true);
      }).to.throw(ResolutionError, "Resolver requires instance to be resolved");
    });

    it("should fail with require false and resolved instance", function() {
      var res = new Resolution();
      res.resolve("hey");
      expect(function() {
        res.instance(false);
      }).to.throw(ResolutionError, "Resolver requires instance to not yet be resolved");
    });

    it("should return resolved null", function() {
      var res = new Resolution();
      res.resolve(null);
      expect(res.instance()).to.be.null;
    });

    it("should return resolved instance", function() {
      var res = new Resolution();
      res.resolve("hey");
      res.instance().should.equal("hey");
    });
  });

  describe("#toString", function() {

    it("should return a string representation", function() {
      var res = new Resolution();
      var s = res.toString();
      s.toString().should.equal("Resolution {instance: undefined, error: null, done: false}");
    });

  });

});
