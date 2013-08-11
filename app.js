/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , os = require('os')
  , _ = require('underscore');


var app = express()
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , networkInterfaces = os.networkInterfaces()
  , ipAddress = _.filter( networkInterfaces["en0"], function(interface) { return interface["family"] == "IPv4" })[0]["address"];

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(request, response) {
  response.render('index', { title: 'PAAD', host: ipAddress });
});

app.get('/kit', function(request, response) {
  response.render('kit', { title: 'PADD', host: ipAddress });
});

server.listen(app.get('port'), function(){});

app.clients = [];
app.kit = undefined;

io.sockets.on('connection', function (socket) {
  // We only have space for 16 bars
  if (app.clients.length >= 8) {
    return;
  }

  if (socket.id != app.kit) {
    // Let's add your socket, yo
    app.clients.push(socket.id)
    socket.emit('assignSocketId', socket.id);
    socket.broadcast.emit('createSocket', socket.id);
  }

  socket.on('assignKitId', function (data) {
    // remove the kit from the clients group
    app.clients = _.reject(app.clients, function(socket){ return socket == data });
    socket.broadcast.emit('deleteSocket', data);
    // assign the new kit id
    app.kit = socket.id;

    if (app.clients.length > 0) {
      _.each(app.clients, function(client) {
        socket.emit('createSocket', client);
      })
    }
  });

  // Got some keys bro
  socket.on('toggle', function (data) {
    // console.log("KEYDOWN")
    socket.broadcast.emit('toggle', {socket: socket.id, message: data});
  });

  socket.on('activeNote', function(data) {
    socket.broadcast.emit('activeNote', data)
  })

  // Oh no! Yer gone
  socket.on('disconnect', function () {
    if (app.kit == socket.id) {
      app.kit = undefined;
      socket.broadcast.emit('deleteKitSocket')
    }
    app.clients = _.reject(app.clients, function(client){ return client == socket.id; });
    socket.broadcast.emit('deleteSocket', socket.id);
  })

});
