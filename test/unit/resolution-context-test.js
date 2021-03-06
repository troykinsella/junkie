"use strict";
/*jshint -W030 */

var chai = require('chai');
var expect = chai.expect;

var Dependency = require('../../lib/Dependency');
var ResolutionContext = require('../../lib/ResolutionContext');

chai.should();

function newContext(opts) {
  opts = opts || {};
  opts.container = opts.container || "container";
  opts.key = opts.key || "A";
  opts.component = opts.component || "component";
  opts.store = opts.store || {};

  return new ResolutionContext(opts);
}

describe("resolution context", function() {

  it("should require a container option", function() {
    expect(function() {
      new ResolutionContext({
        key: "A",
        component: "c",
        store: {}
      });
    }).to.throw(Error);
  });

  it("should require a key option", function() {
    expect(function() {
      new ResolutionContext({
        container: "c",
        component: "c",
        store: {}
      });
    }).to.throw(Error);
  });

  it("should require a component option", function() {
    expect(function() {
      new ResolutionContext({
        container: "c",
        key: "A",
        store: {}
      });
    }).to.throw(Error);
  });

  it("should accept a null component option", function() {
    new ResolutionContext({
      container: "c",
      key: "A",
      component: null,
      store: {}
    });
  });

  it("should require a store option", function() {
    expect(function() {
      new ResolutionContext({
        container: "c",
        key: "A",
        component: "c"
      });
    }).to.throw(Error);
  });

  describe("#previous", function() {

    it("should return null if previous undefined", function() {
      var ctx = newContext();
      expect(ctx.previous()).to.be.null;
    });

    it("should return the previous context", function() {
      var prev = newContext();
      var ctx = newContext({
        previous: prev
      });

      ctx.previous().should.equal(prev);
    });
  });

  describe("#keyStack", function() {

    it("should return the current key with no previous", function() {
      var ctx = newContext();
      ctx.keyStack().should.deep.equal([ "A" ]);
    });

    it("should include the previous context key", function() {
      var prev = newContext({
        key: "B"
      });
      var ctx = newContext({
        previous: prev
      });

      ctx.keyStack().should.deep.equal([ "B", "A" ]);
    });

    it("should include the previous previous context key", function() {
      var prevprev = newContext({
        key: "C"
      });
      var prev = newContext({
        key: "B",
        previous: prevprev
      });
      var ctx = newContext({
        previous: prev
      });

      ctx.keyStack().should.deep.equal([ "C", "B", "A" ]);
    });

  });

  describe("#store", function() {

    it("should return the store object when no arguments", function() {
      var store = {
        foo: "bar"
      };
      var ctx = newContext({
        store: store
      });

      ctx.store().should.deep.equal(store);
    });

    it("should get a store entry when key argument", function() {
      var store = {
        foo: "bar"
      };
      var ctx = newContext({
        store: store
      });

      ctx.store("foo").should.equal("bar");
    });

    it("should set a store entry when key and value arguments", function() {
      var store = {
        foo: "bar"
      };
      var ctx = newContext({
        store: store
      });

      ctx.store("foo", "baz");
      ctx.store("foo").should.equal("baz");
    });
  });

  describe("#resolve", function() {

    it("should resolve single dep", function(done) {
      var ctx = newContext();
      ctx._resolveDep = function(dep) {
        dep.should.be.an.instanceof(Dependency);
        dep.key().should.equal("A");
        return Promise.resolve("foo");
      };

      var p = ctx.resolve("A");
      p.should.be.an.instanceof(Promise);

      p.then(function(result) {
          result.should.equal("foo");
          done();
        })
        .catch(done);
    });

    it("should resolve dep array", function(done) {
      var ctx = newContext();
      var didA = false;

      ctx._resolveDep = function(dep, options) {
        if (didA) {
          dep.should.be.an.instanceof(Dependency);
          dep.key().should.equal("B");
          return Promise.resolve("bar");

        } else {
          dep.should.be.an.instanceof(Dependency);
          dep.key().should.equal("A");
          didA = true;
          return Promise.resolve("foo");
        }
      };

      var p = ctx.resolve([ "A", "B" ]);
      p.should.be.an.instanceof(Promise);

      p.then(function(result) {
        result.should.be.a("object");
        result.should.deep.equal({
          list: [ "foo", "bar" ],
          map: {
            "A": "foo",
            "B": "bar"
          }
        });
        done();
      })
      .catch(done);
    });

  });

  describe("#toString", function() {

    it("should return a string representation", function() {
      var ctx = newContext();
      ctx.toString().should.equal("ResolutionContext {keyStack: [\"A\"], storeKeys: []}");
    });

  });

});
