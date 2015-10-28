"use strict";
/*jshint -W030 */

var chai = require('chai');
chai.should();

var junkie = require('../../lib/junkie');
var Container = require('../../lib/Container');

describe("junkie", function() {

  describe("#newContainer", function() {

    it("should return a container instance", function() {
      var c = junkie.newContainer();
      c.should.not.be.null;
      c.should.be.an.instanceof(Container);
    });

  });

});
