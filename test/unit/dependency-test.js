"use strict";
/*jshint -W030 */

var chai = require('chai');
var Dependency = require('../../lib/Dependency');

chai.should();

describe("dependency", function() {

  describe("#getOrCreate", function() {

    it("should parse a string key", function() {
      var dep = Dependency.getOrCreate("foo");
      dep.key().should.equal("foo");
      dep.optional().should.be.false;
    });

    it("should parse an optional string key", function() {
      var dep = Dependency.getOrCreate("foo?");
      dep.key().should.equal("foo");
      dep.optional().should.be.true;
    });

    it("should return an existing Dependency instance", function() {
      var dep1 = Dependency.getOrCreate("foo");
      var dep2 = Dependency.getOrCreate(dep1);
      dep1.should.equal(dep2);
    });

    it("should observe optional option", function() {
      var dep = Dependency.getOrCreate("foo", { optional: true });
      dep.key().should.equal("foo");
      dep.optional().should.be.true;
    });
  });

});
