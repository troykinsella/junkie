"use strict";
/*jshint -W030 */

var chai = require('chai');
chai.should();

var junkie = require('../../lib/junkie');
var Container = require('../../lib/Container');
var Injector = require('../../lib/Injector');
var InjectorFactory = require('../../lib/InjectorFactory');
var ResolutionError = require('../../lib/ResolutionError');

describe("junkie", function() {

  describe("exports", function() {

    it("should expose Injector", function() {
      junkie.Injector.should.equal(Injector);
    });

    it("should expose InjectorFactory", function() {
      junkie.InjectorFactory.should.equal(InjectorFactory);
    });

    it("should expose ResolutionError", function() {
      junkie.ResolutionError.should.equal(ResolutionError);
    });

  });

  describe("#newContainer", function() {

    it("should return a container instance", function() {
      var c = junkie.newContainer();
      c.should.not.be.null;
      c.should.be.an.instanceof(Container);
    });

  });

});
