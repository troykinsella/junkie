"use strict";
/*jshint -W030 */

var chai = require('chai');
var expect = chai.expect;

var Resolver = require('../../lib/Resolver');
var ResolutionError = require('../../lib/ResolutionError');

chai.should();

describe("resolver", function() {

  describe("#args", function() {
    it("should return no arguments", function() {
      var res = new Resolver(function() {});
      res.args().should.deep.equal([]);
    });

    it("should return arguments", function() {
      var res = new Resolver(function() {}, [ "foo", "bar" ]);
      res.args().should.deep.equal([ "foo", "bar" ]);
    });

    it("should return immutable arguments", function() {
      var res = new Resolver(function() {}, [ "foo" ]);
      res.args().push("bar");
      res.args().should.deep.equal([ "foo" ]);
    });
  });

  describe("#arg", function() {

    it("should fail when index out of bounds", function() {
      var res = new Resolver(function cool() {});
      expect(function() {
        res.arg(0);
      }).to.throw(ResolutionError, "Resolver cool requires argument at index: 0");
    });

    it("should fail when argument is undefined", function() {
      var res = new Resolver(function cool() {}, [ undefined, "foo" ]);
      expect(function() {
        res.arg(0);
      }).to.throw(ResolutionError, "Resolver cool requires argument at index: 0");
    });

    it("should fail when argument is null", function() {
      var res = new Resolver(function cool() {}, [ null, "foo" ]);
      expect(function() {
        res.arg(0);
      }).to.throw(ResolutionError, "Resolver cool requires argument at index: 0");
    });

    it("should fail with custom message", function() {
      var res = new Resolver(function cool() {});
      expect(function() {
        res.arg(0, "Args suck!");
      }).to.throw(ResolutionError, "Args suck!");
    });

    it("should return argument at index", function() {
      var res = new Resolver(function() {}, [ "foo", "bar" ]);
      res.arg(0).should.equal("foo");
      res.arg(1).should.equal("bar");
    });
  });

  describe(".normalize", function() {

    it("should wrap a resolver implementation", function(done) {
      var res = Resolver.normalize(function() {
        done();
      });

      res.resolve({}, {}, function() {});
    });

    it("should return a resolver", function() {
      var res1 = new Resolver(function() {});
      var res2 = Resolver.normalize(res1);
      res1.should.equal(res2);
    });

  });

});
