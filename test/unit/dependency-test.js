"use strict";
/*jshint -W030 */

var chai = require('chai');
var Dependency = require('../../lib/Dependency');

chai.should();

describe("dependency", function() {

  describe("parse", function() {

    it("should parse a string key", function() {
      var dep = Dependency.parse("foo");
      dep.key().should.equal("foo");
      dep.optional().should.be.false;
    });

    it("should parse an optional string key", function() {
      var dep = Dependency.parse("foo?");
      dep.key().should.equal("foo");
      dep.optional().should.be.true;
    });

  });

});
