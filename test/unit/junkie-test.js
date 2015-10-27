
const chai = require('chai');
chai.should();

const junkie = require('../../lib/junkie');
const Container = require('../../lib/Container');

describe("junkie", function() {

  describe("#newContainer", function() {

    it("should return a container instance", function() {
      var c = junkie.newContainer();
      c.should.not.be.null;
      c.should.be.an.instanceof(Container);
    });

  });

});
