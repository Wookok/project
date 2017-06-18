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

var GameManager = require('./modules/GameManager.js');
var GM = new GameManager();
var User = require('./modules/User.js');

var io = socketio.listen(server);

var user;
io.on('connection', function(socket){
  console.log('user connect : ' + socket.id);

  socket.on('reqStartGame', function(){
    user = new User(socket.id);
    user.initialize();
    GM.joinUser(user);
    var data = GM.updateDataSetting();
    console.log(data);
    console.log(JSON.stringify(data).length);
    socket.emit('resStartGame', data);
  });

  socket.on('disconnect', function(){
    console.log('user disconnect :' + socket.id);
  });
});
