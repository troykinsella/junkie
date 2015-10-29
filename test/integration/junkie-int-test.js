"use strict";
/*jshint -W030 */

var chai = require('chai');
var expect = chai.expect;

var junkie = require('../../lib/junkie');
var ResolutionError = require('../../lib/ResolutionError');

chai.should();

function createType() {
  var f = function() {
    this._args = Array.prototype.slice.apply(arguments);
  };

  f.prototype.set = function() {
    this._set = Array.prototype.slice.apply(arguments);
  };

  return f;
}

function createFactory(Type) {
  return function() {
    var args = Array.prototype.slice.apply(arguments);
    var t = Object.create(Type.prototype);
    Type.apply(t, args);
    return t;
  };
}

var A, B, C, D;
var AFactory, BFactory;

describe("junkie integration", function() {

  beforeEach(function() {
    A = createType();
    B = createType();
    C = createType();
    D = createType();

    AFactory = createFactory(A);
    BFactory = createFactory(B);
  });


  describe("empty container", function() {

    it('should fail resolve', function() {
      var c = junkie.newContainer();

      expect(function() {
        c.resolve("A");
      }).to.throw(ResolutionError, "Not found: A");
    });

    it('should resolve null for optional', function() {
      var c = junkie.newContainer();
      expect(c.resolve("A", { optional: true })).to.be.null;
    });

  });

  describe("multiple resolves", function() {

    it("should resolve the same type", function() {
      var c = junkie.newContainer();

      c.register("A", A);

      var A1 = c.resolve("A");
      var A2 = c.resolve("A");
      A1.should.equal(A2);
    });

    it("should resolve the same instance", function() {
      var c = junkie.newContainer();

      var a = new A();
      c.register("A", a);

      var a1 = c.resolve("A");
      var a2 = c.resolve("A");
      a1.should.equal(a2);
    });

    it("should resolve the same string", function() {
      var c = junkie.newContainer();

      c.register("A", "wtf");

      var a1 = c.resolve("A");
      var a2 = c.resolve("A");
      a1.should.equal(a2);
    });

    it("should resolve different constructed instances", function() {
      var c = junkie.newContainer();

      c.register("A", A).with.constructor();

      var a1 = c.resolve("A");
      var a2 = c.resolve("A");
      a1.should.not.equal(a2);
    });

    it("should resolve different factory-created instances", function() {
      var c = junkie.newContainer();

      c.register("A", AFactory).as.factory();

      var a1 = c.resolve("A");
      var a2 = c.resolve("A");
      a1.should.not.equal(a2);
    });
  });

  describe("no deps", function() {

    describe("no injector", function() {

      it("should resolve type", function() {
        var c = junkie.newContainer();

        c.register("A", A);

        var result = c.resolve("A");
        result.should.equal(A);
      });

      it("should resolve instance", function() {
        var c = junkie.newContainer();

        var a = new A();
        c.register("A", a);

        var result = c.resolve("A");
        result.should.equal(a);
      });

      it("should resolve string", function() {
        var c = junkie.newContainer();

        c.register("A", "wtf");

        var result = c.resolve("A");
        result.should.equal("wtf");
      });

    });

    describe("constructor injector", function() {

      it('should construct an instance', function() {
        var c = junkie.newContainer();

        c.register("A", A).with.constructor();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
      });

      it('should construct instances', function() {
        var c = junkie.newContainer();

        c.register("A", A).with.constructor();
        c.register("B", B).with.constructor();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);

        result = c.resolve("B");
        result.should.be.an.instanceof(B);
      });

    });

    describe("factory injector", function() {

      it('should construct an instance', function() {
        var c = junkie.newContainer();

        c.register("A", AFactory).as.factory();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
      });

      it('should construct instances', function() {
        var c = junkie.newContainer();

        c.register("A", AFactory).as.factory();
        c.register("B", BFactory).as.factory();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);

        result = c.resolve("B");
        result.should.be.an.instanceof(B);
      });

    });

    describe("mixed injectors", function() {

      it('should resolve mixed', function() {
        var c = junkie.newContainer();

        c.register("A", A).with.constructor();
        c.register("B", B);
        c.register("C", "c");

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);

        result = c.resolve("B");
        result.should.equal(B);

        result = c.resolve("C");
        result.should.equal("c");
      });

    });
  });

  describe("one dep", function() {

    describe("constructor injector", function() {

      it("should inject a type", function() {
        var c = junkie.newContainer();

        c.register("A", A).inject("B").into.constructor();
        c.register("B", B);

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(1);
        result._args[0].should.equal(B);
      });

      it("should inject constructed instance", function() {
        var c = junkie.newContainer();

        c.register("A", A).inject("B").into.constructor();
        c.register("B", B).with.constructor();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(1);
        result._args[0].should.be.an.instanceof(B);
      });

      it("should inject factory-created instance", function() {
        var c = junkie.newContainer();

        c.register("A", A).inject("B").into.constructor();
        c.register("B", BFactory).as.factory();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(1);
        result._args[0].should.be.an.instanceof(B);
      });
    });

    describe("factory injector", function() {

      it("should inject a type", function() {
        var c = junkie.newContainer();

        c.register("A", AFactory).inject("B").into.factory();
        c.register("B", B);

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(1);
        result._args[0].should.equal(B);
      });

      it("should inject a constructed instance", function() {
        var c = junkie.newContainer();

        c.register("A", AFactory).inject("B").into.factory();
        c.register("B", B).with.constructor();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(1);
        result._args[0].should.be.an.instanceof(B);
      });

      it("should inject a factory-created instance", function() {
        var c = junkie.newContainer();

        c.register("A", AFactory).inject("B").into.factory();
        c.register("B", BFactory).as.factory();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(1);
        result._args[0].should.be.an.instanceof(B);
      });
    });

    describe("method injector", function() {

      it("should inject a type", function() {
        var c = junkie.newContainer();

        var Type = {
          set: function() {
            this._set = Array.prototype.slice.apply(arguments);
          }
        };

        c.register("A", Type).inject("B").into.method("set");
        c.register("B", B);

        var result = c.resolve("A");
        result.should.equal(Type);
        result._set.should.deep.equal([ B ]);
      });

      it("should inject a type into an instance", function() {
        var c = junkie.newContainer();

        c.register("A", A).with.constructor().inject("B").into.method("set");
        c.register("B", B);

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(0);
        result._set.should.deep.equal([ B ]);
      });

      it("should inject a constructed instance", function() {
        var c = junkie.newContainer();

        c.register("A", A).with.constructor().inject("B").into.method("set");
        c.register("B", B).with.constructor();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(0);
        result._set[0].should.be.instanceof(B);
      });

      it("should inject a factory-created instance", function() {
        var c = junkie.newContainer();

        c.register("A", A).with.constructor().inject("B").into.method("set");
        c.register("B", BFactory).as.factory();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(0);
        result._set[0].should.be.instanceof(B);
      });

      it("should fail when method not found", function() {
        var c = junkie.newContainer();

        c.register("A", A).with.constructor().inject("B").into.method("nope");
        c.register("B", B).with.constructor();

        expect(function() {
          c.resolve("A");
        }).to.throw(ResolutionError, "Method not found: nope");
      });
    });


    describe("field injector", function() {

      it("should inject a type", function() {
        var c = junkie.newContainer();

        var Type = {
          field: null
        };

        c.register("A", Type).inject("B").into.field("field");
        c.register("B", B);

        var result = c.resolve("A");
        result.should.equal(Type);
        result.field.should.equal(B);
      });

      it("should inject a type into an instance", function() {
        var c = junkie.newContainer();

        c.register("A", A).with.constructor().inject("B").into.field("field");
        c.register("B", B);

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(0);
        result.field.should.equal(B);
        delete A.field;
      });

      it("should inject a constructed instance", function() {
        var c = junkie.newContainer();

        c.register("A", A).with.constructor().inject("B").into.field("field");
        c.register("B", B).with.constructor();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(0);
        result.field.should.be.instanceof(B);
      });

      it("should inject a factory-created instance", function() {
        var c = junkie.newContainer();

        c.register("A", A).with.constructor().inject("B").into.field("field");
        c.register("B", BFactory).as.factory();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.length.should.equal(0);
        result.field.should.be.instanceof(B);
      });

    });

  });

  describe("multiple injectors", function() {

    it("should inject several dependencies", function() {
      var c = junkie.newContainer();

      c.register("A", A)
        .inject("B").into.constructor()
        .inject("C").into.method("set")
        .inject("D").into.field("field");
      c.register("B", B);
      c.register("C", C);
      c.register("D", D);

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.should.deep.equal([ B ]);
      result._set.should.deep.equal([ C ]);
      result.field.should.equal(D);
    });

    it("should fail multiple creator injectors", function() {
      var c = junkie.newContainer();

      c.register("A", A)
        .inject("B").into.constructor()
        .inject("C").into.factory();

      expect(function() {
        c.resolve("A");
      }).to.throw(Error, "Multiple creator injectors");
    });

  });

  describe("two deps", function() {

    it("should inject types into constructor", function() {
      var c = junkie.newContainer();

      c.register("A", A).inject("B", "C").into.constructor();
      c.register("B", B);
      c.register("C", C);

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.should.deep.equal([ B, C ]);
    });

    it("should inject constructed instances into constructor", function() {
      var c = junkie.newContainer();

      c.register("A", A).inject("B", "C").into.constructor();
      c.register("B", B).with.constructor();
      c.register("C", C).with.constructor();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(2);
      result._args[0].should.be.an.instanceof(B);
      result._args[1].should.be.an.instanceof(C);
    });

  });


  describe("transitive deps", function() {

    it("should inject into constructors", function() {
      var c = junkie.newContainer();

      c.register("A", A).inject("B").into.constructor();
      c.register("B", B).inject("C").into.constructor();
      c.register("C", C).with.constructor();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.length.should.equal(1);
      result._args[0].should.be.an.instanceof(B);
      result._args[0]._args.length.should.equal(1);
      result._args[0]._args[0].should.be.an.instanceof(C);
    });


  });

  describe("circular deps", function() {

    function assertResolutionError(c, keys) {
      keys.forEach(function(key) {
        expect(function() {
          c.resolve(key);
        }).to.throw(ResolutionError, "Circular dependency: " + key);
      });
    }

    it("should throw ResolutionError for 1st degree", function() {
      var c = junkie.newContainer();

      c.register("A", A).inject("B").into.constructor();
      c.register("B", B).inject("A").into.constructor();

      assertResolutionError(c, [ "A", "B" ]);
    });

    it("should throw ResolutionError for 2nd degree", function() {
      var c = junkie.newContainer();

      c.register("A", A).inject("B").into.constructor();
      c.register("B", B).inject("C").into.constructor();
      c.register("C", C).inject("A").into.constructor();

      assertResolutionError(c, [ "A", "B", "C" ]);
    });

    it("should throw ResolutionError for 3rd degree", function() {
      var c = junkie.newContainer();

      c.register("A", A).inject("B").into.constructor();
      c.register("B", B).inject("C").into.constructor();
      c.register("C", C).inject("D").into.constructor();
      c.register("D", D).inject("A").into.constructor();

      assertResolutionError(c, [ "A", "B", "C", "D" ]);
    });
  });

  /*
  TODO: this only seems to pass in isolation wtf
  describe("optional deps", function() {

    it("should inject null when dependency missing", function() {
      var c = junkie.newContainer();

      c.register("A", A).inject.optional("B").into.constructor();

      var result = c.resolve("A");
      result.should.be.an.instanceof(A);
      result._args.should.deep.equal([ null ]);
    });

  });*/

  describe("caching", function() {

    describe("no deps", function() {

      it("should have no effect on singleton", function() {
        var c = junkie.newContainer();

        c.register("A", A).with.caching();

        var A1 = c.resolve("A");
        var A2 = c.resolve("A");
        A1.should.equal(A2);
      });

      it("should cache constructed instance", function() {
        var c = junkie.newContainer();

        c.register("A", A).with.constructor().with.caching();

        var a1 = c.resolve("A");
        var a2 = c.resolve("A");
        a1.should.equal(a2);
      });

      it("should cache factory-injected instance", function() {
        var c = junkie.newContainer();

        c.register("A", AFactory).as.factory().with.caching();

        var a1 = c.resolve("A");
        var a2 = c.resolve("A");
        a1.should.equal(a2);
      });
    });


  });

});
