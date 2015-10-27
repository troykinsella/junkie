
const chai = require('chai');
const expect = chai.expect;
const Dependency = require('../../lib/Dependency');

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

    it("should parse an object key", function() {
      var dep = Dependency.parse({
        type: "foo"
      });
      dep.key().should.equal("foo");
      dep.optional().should.be.false;
    });

    it("should parse an optional object key", function() {
      var dep = Dependency.parse({
        type: "foo",
        optional: true
      });
      dep.key().should.equal("foo");
      dep.optional().should.be.true;
    });

    it("should parse an object key with injector", function() {
      var dep = Dependency.parse({
        type: "foo",
        injector: "bar"
      });
      dep.key().should.equal("foo");
      dep.optional().should.be.false;
    });
  });

});
