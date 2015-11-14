"use strict";
/*jshint -W030 */

var chai = require('chai');

chai.should();

function clearUtilRequireCache() {
  delete require.cache[require.resolve('../../lib/util')];
}

describe("util", function() {

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
