var junkie = require('..'); // Normally: require('junkie');
var c = junkie.newContainer();

// Define application entities

function Server(config) {
  var state = "stopped";

  this.start = function() {
    return new Promise(function(resolve, reject) {
      // Simulate an async start-up delay
      setTimeout(function() {
        console.log("Listening on port " + config.port);
        state = "running";
        resolve();
      }, 500);
    });
  };

  this.state = function() {
    return state;
  };
}

function MyDBImpl() {
  this.name = function() {
    return "myDB";
  };
}

function DBFactory() {
  // This factory is async, presumably because it triggers a database connection
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve(new MyDBImpl());
    });
  });
}

function App(server, db) {

  this.status = function() {
    console.log("Server state: " + server.state());
    console.log("DB Provider: " + db.name());
  };

}

var config = {
  server: {
    port: 8080
  }
};

// Wire up the container

c.register("App", App)
  .with.constructor("Server", "DB");

c.register("Server", Server)
  .with.constructor("ServerConfig")
  .and.method("start", { await: true });

c.register("DB", DBFactory)
  .as.factory();

c.register("ServerConfig", config.server);

// Resolve the application instance

c.resolve("App").then(function(app) {
  app.status();
}).catch(function(err) {
  console.log("Uh oh:", err);
});

/*
Output:

Listening on port 8080
Server state: running
DB Provider: myDB
*/
