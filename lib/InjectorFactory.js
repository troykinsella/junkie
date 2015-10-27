


const InjectorFactory = {

  _map: {},

  create: function(name) {
    var args = Array.prototype.slice.apply(arguments);

    var Type = this._map[name];
    if (!Type) {
      throw new Error('Injector not found: ' + name);
    }

    var inst = new (Function.prototype.bind.apply(Type, args));
    return inst;
  },

  names: function() {
    return Object.keys(this._map);
  },

  register: function(name, Type) {
    this._map[name] = Type;
  }

};

// Register standard injectors

[ 'constructor', 'field', 'method' ]
  .forEach(function(name) {
    var moduleName = name[0].toUpperCase() + name.substring(1) + "Injector";
    InjectorFactory.register(name, require('./injector/' + moduleName));
  });

module.exports = InjectorFactory;
