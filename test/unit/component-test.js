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

      var calls = 0;
      comp.use(function(res, next) {
        calls++; // Called several times, each phase
        next();
      });

      comp.resolve();
      calls.should.be.above(0);
    });

    /*it("should fail async middleware", function(done) {
      var A = function() {};
      var comp = new Component(A, A);

      comp.use(function(res, next) {
        done();
        process.nextTick(next);
      });

      expect(comp.resolve).to.throw(Error);
    });*/

    it('should resolve instance with no middleware', function() {
      var A = function() {};
      var a = new A();
      var comp = new Component(A, a, dummyContainer);

      var res = comp.resolve();
      res.instance().should.equal(a);
    });
  });

});
