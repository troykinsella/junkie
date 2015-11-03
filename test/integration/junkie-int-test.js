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

  // CONTAINER /////////////////////////////////////////////////////////////////////////////////////////////////////////

  describe("container", function() {

    describe("empty", function() {

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

  // CHILD CONTAINERS //////////////////////////////////////////////////////////////////////////////////////////////////

  describe("child container", function() {

    it('should search parent for component', function() {
      var parent = junkie.newContainer();

      parent.register("A", A);

      var child = parent.newChild();
      var instance = child.resolve("A");

      instance.should.equal(A);
    });

    it('should search parent for component', function() {
      var parent = junkie.newContainer();

      parent.register("A", A);

      var child = parent.newChild();
      var instance = child.resolve("A");

      instance.should.equal(A);
    });

    it('should override parent container components', function() {
      var grandparent = junkie.newContainer();
      var parent = grandparent.newChild();
      var child = parent.newChild();

      grandparent.register("A", A);
      parent.register("A", B);
      child.register("A", C);

      grandparent.resolve("A").should.equal(A);
      parent.resolve("A").should.equal(B);
      child.resolve("A").should.equal(C);
    });
  });

  // DISPOSED CONTAINERS ///////////////////////////////////////////////////////////////////////////////////////////////

  describe("disposed container", function() {

    it('should fail subsequent modifying operations', function() {
      var c = junkie.newContainer();
      c.dispose();

      var msg = "Container disposed";
      expect(c.newChild.bind(c)).to.throw(Error, msg);
      expect(c.use.bind(c)).to.throw(Error, msg);
      expect(c.register.bind(c)).to.throw(Error, msg);
    });

    it('should pass through resolves to parent', function() {
      var grandparent = junkie.newContainer();
      var parent = grandparent.newChild();
      var child = parent.newChild();

      grandparent.register("A", A);
      parent.register("A", B);
      child.register("A", C);

      child.resolve("A").should.equal(C);
      child.dispose();
      child.resolve("A").should.equal(B);
      parent.dispose();
      child.resolve("A").should.equal(A);
    });

  });

  // CONSTRUCTOR INJECTOR //////////////////////////////////////////////////////////////////////////////////////////////

  describe("constructor injector", function() {

    describe("with no deps", function() {

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

      it("should fail a non-function component", function() {

        var c = junkie.newContainer();

        c.register("A", {}).with.constructor();

        expect(function() {
          c.resolve("A");
        }).to.throw(ResolutionError, "Constructor injector: Component must be a function: object");
      });

    });

    describe("with one dep", function() {

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

    describe("with transitive deps", function() {

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


    describe("optional deps", function() {

      it("should inject null when dependency missing", function() {
        var c = junkie.newContainer();

        c.register("A", A).inject.optional("B").into.constructor();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
        result._args.should.deep.equal([ null ]);
      });

    });

  });

  // FACTORY INJECTOR //////////////////////////////////////////////////////////////////////////////////////////////////

  describe("factory injector", function() {

    describe("with no deps", function() {

      it('should construct an instance', function () {
        var c = junkie.newContainer();

        c.register("A", AFactory).as.factory();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);
      });

      it('should construct instances', function () {
        var c = junkie.newContainer();

        c.register("A", AFactory).as.factory();
        c.register("B", BFactory).as.factory();

        var result = c.resolve("A");
        result.should.be.an.instanceof(A);

        result = c.resolve("B");
        result.should.be.an.instanceof(B);
      });

      it('should fail non-function component', function() {
        var c = junkie.newContainer();

        c.register("A", {}).as.factory();

        expect(function() {
          c.resolve("A");
        }).to.throw(ResolutionError, "Factory injector: Component must be a function: object");
      });
    });

    describe("with one dep", function() {

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

    // TODO: transitive deps
    // TODO: circular deps
    // TODO: optional deps
  });

  // CREATOR INJECTOR //////////////////////////////////////////////////////////////////////////////////////////////////

  describe("creator injector", function() {

    describe("with no deps", function() {

      it("should create an instance with no initializer", function() {
        var c = junkie.newContainer();

        var AnA = {
          field: true
        };

        c.register("A", AnA).as.creator();

        var result = c.resolve("A");
        result.field.should.be.true;
      });

      it("should create separate instances with no initializer", function() {
        var c = junkie.newContainer();

        var AnA = {
          field: true
        };

        c.register("A", AnA).as.creator();

        var a1 = c.resolve("A");
        var a2 = c.resolve("A");
        a1.field.should.be.true;
        a2.field.should.be.true;
        a1.should.not.equal(a2);
      });

      it("should create an instance with initializer", function() {
        var c = junkie.newContainer();

        var AnA = {
          init: function() {
            this._args = Array.prototype.slice.apply(arguments);
          }
        };

        c.register("A", AnA).with.creator("init");

        var result = c.resolve("A");
        result._args.should.deep.equal([]);
      });

      it("should fail missing initalizer", function() {
        var c = junkie.newContainer();

        var AnA = {};

        c.register("A", AnA).with.creator("init");

        expect(function() {
          c.resolve("A");
        }).to.throw(ResolutionError, "Initializer function not found: init");
      });

      it("should fail non-function initalizer", function() {
        var c = junkie.newContainer();

        var AnA = {
          init: "wtf"
        };

        c.register("A", AnA).with.creator("init");

        expect(function() {
          c.resolve("A");
        }).to.throw(ResolutionError, "Initializer function not found: init");
      });

    });

    describe("with one dep", function() {

      it("should create an instance with initializer", function() {
        var c = junkie.newContainer();

        var AnA = {
          init: function() {
            this._args = Array.prototype.slice.apply(arguments);
          }
        };

        c.register("A", AnA).inject("B").into.creator("init");
        c.register("B", B);

        var result = c.resolve("A");
        result._args.should.deep.equal([ B ]);
      });

      it("should fail no initalizer method", function() {
        var c = junkie.newContainer();

        var AnA = {};

        c.register("A", AnA).inject("B").into.creator();
        c.register("B", B);

        expect(function() {
          c.resolve("A");
        }).to.throw(ResolutionError, "Initializer function not specified, but dependencies supplied");
      });

    });

    // TODO: transitive deps
    // TODO: circular deps
    // TODO: optional deps

  });

  // METHOD INJECTOR ///////////////////////////////////////////////////////////////////////////////////////////////////

  describe("method injector", function() {

    describe("with one dep", function() {

      it("call a method", function() {
        var c = junkie.newContainer();

        var Type = {
          set: function() {
            this._set = Array.prototype.slice.apply(arguments);
          }
        };

        c.register("A", Type).with.method("set");

        var result = c.resolve("A");
        result.should.equal(Type);
        result._set.should.deep.equal([]);
      });

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

    // TODO: transitive deps
    // TODO: circular deps
    // TODO: optional deps

  });

  // FIELD INJECTOR ////////////////////////////////////////////////////////////////////////////////////////////////////

  describe("field injector", function() {

    describe("no deps", function() {

      it("should fail", function() {
        var c = junkie.newContainer();

        var Type = {
          field: null
        };

        c.register("A", Type).with.field("field");

        expect(function() {
          c.resolve("A");
        }).to.throw(ResolutionError, "Field injector: Must inject one and only one dependency");
      });

    });

    describe("with one dep", function() {

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

    describe("with two deps", function() {

      it("should fail", function() {
        var c = junkie.newContainer();

        c.register("A", A).with.constructor().inject("B", "C").into.field("field");
        c.register("B", B);
        c.register("C", C);

        expect(function() {
          c.resolve("A");
        }).to.throw(ResolutionError, "Field injector: Must inject one and only one dependency");
      });

    });

    // TODO: transitive dep
    // TODO: circular dep
    // TODO: optional dep

  });

  // MULTIPLE INJECTORS ////////////////////////////////////////////////////////////////////////////////////////////////

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

    // TODO: transitive dep
    // TODO: circular dep
    // TODO: optional dep

  });

  // CACHING RESOLVER //////////////////////////////////////////////////////////////////////////////////////////////////

  describe("caching resolver", function() {

    describe("with no deps", function() {

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

    // TODO: with deps
  });

});
