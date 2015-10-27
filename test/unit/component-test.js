
const chai = require('chai');
const expect = chai.expect;
const Component = require('../../lib/Component');

chai.should();

describe("component", function() {

  describe("#use", function() {

    it("should fail with non-function", function() {
      const A = function() {};
      const comp = new Component(A, A);

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

    it("should invoke middleware", function(done) {
      const A = function() {};
      const comp = new Component(A, A);

      comp.use(function(res, next) {
        done();
        next();
      });

      comp.resolve();
    });

    it("should fail async middleware", function() {
      const A = function() {};
      const comp = new Component(A, A);

      comp.use(function(res, next) {
        done();
        process.nextTick(next);
      });

      expect(comp.resolve).to.throw(Error);
    });

    it('should resolve instance with no middleware', function() {
      const A = function() {};
      const a = new A();
      const comp = new Component(A, a);

      var res = comp.resolve();
      res.instance().should.equal(a);
    });
  });

});
