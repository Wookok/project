'use strict';

var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var path = require('path');

var app = express();
var config = require('./config.json');

app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app);
var port = process.env.PORT || config.port;

server.listen(port, function(){
  console.log('Server is Running');
});

var io = socketio.listen(server);

io.on('connection', function(socket){
  console.log('user connect : ' + socket.id);

  socket.on('disconnect', function(){
    console.log('user disconnect :' + socket.id);
  });
});
