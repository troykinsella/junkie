"use strict";

var chai = require('chai');
var expect = chai.expect;
var Component = require('../../lib/Component');

chai.should();

var dummyContainer = "container";

describe("component", function() {

  describe("#use", function() {

    it("should fail with non-function", function() {
      var A = function() {};
      var comp = new Component(A, A, dummyContainer);

      function use(arg) {
        expect(function() {
          comp.use(arg);
        }).to.throw();
      }

      [
        undefined,
        null,
        "wtf",
        0,
        1,
        true,
        false,
//        /re/,
//        {},
//        []
      ].forEach(use);
    });

  });

  describe("#resolve", function() {

    it("should invoke middleware", function() {
      var A = function() {};
      var comp = new Component(A, A, dummyContainer);

      comp.use(function(ctx, res) {
        res.resolve((res.instance() || 0) + 1);
      });

      return comp.resolve().then(function(result) {
        result.should.equal(1);
      });
    });

    it('should resolve component with no middleware', function() {
      var A = function() {};
      var comp = new Component("A", A, dummyContainer);

      return comp.resolve().then(function(result) {
        result.should.equal(A);
      });
    });
  });

});
