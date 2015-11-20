"use strict";
/*jshint -W030 */

var chai = require('chai');
var expect = chai.expect;
chai.should();

function clearUtilRequireCache() {
  delete require.cache[require.resolve('../../lib/util')];
}

describe("util", function() {

  describe("#assert", function() {

    var util = require('../../lib/util');

    it("should pass a true condition", function() {
      util.assert(true);
    });

    it("should fail a false condition", function() {
      expect(function() {
        util.assert(false, "foo");
      }).to.throw(Error, "foo");
    });

    it("should fail with a custom error type", function() {
      expect(function() {
        util.assert(false, "foo", TypeError);
      }).to.throw(TypeError, "foo");
    });

  });

  describe("#assert.type", function() {

    var util = require('../../lib/util');

    it("should pass a matching type", function() {
      util.assert.type("foo", "string");
    });

    it("should fail a bad type", function() {
      expect(function() {
        util.assert.type("foo", "function");
      }).to.throw(Error);
    });

    it("should pass matching types", function() {
      util.assert.type("foo", [ "object", "string" ]);
    });

    it("should understand array type", function() {
      util.assert.type([], "array");
    });
  });

  describe("#inherits shim", function() {

    var realObjectCreate;

    before(function() {
      realObjectCreate = Object.create;
      delete Object.create;
      clearUtilRequireCache();
    });

    it("should provide inherits implementation", function() {
      var util = require('../../lib/util');

      function A() {}
      A.prototype.foo = function() {
        return "foo";
      };

      function B() {
        A.call(this);
      }
      util.inherits(B, A);

      // Restore Object.create here, after the inherit call,
      // as it seems to be a dependency of the mocha or chai,
      // and without it, the below 'should' complains accordingly.
      clearUtilRequireCache();
      Object.create = realObjectCreate;

      var b = new B();
      b.foo().should.equal("foo");
    });

  });

});
