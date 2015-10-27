
const chai = require('chai');
const expect = chai.expect;
const Container = require('../../lib/Container');

chai.should();

describe("container", function() {

  describe("#register", function() {

    it("should return component interface", function() {
      var c = new Container();
      var A = function() {};

      var comp = c.register("A", A);

      comp.with.should.be.a('function');
      comp.as.should.be.a('function');
      comp.inject.should.be.a('function');
    });

  });

  describe("#resolve", function() {

    it("should fail when C not found and no parent container", function() {
      var c = new Container();
      var A = function() {};

      expect(function() {
        c.resolve("A");
      }).to.throw(Error);
    });



  });

});
