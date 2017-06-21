'use strict';

var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var path = require('path');

var app = express();
var config = require('./config.json');
var gameConfig = require('./gameConfig.json');

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

io.on('connection', function(socket){
  console.log('user connect : ' + socket.id);
  var user;

  socket.on('reqStartGame', function(){
    user = new User(socket.id);
    user.initialize();
    GM.joinUser(user);
    var data = GM.updateDataSetting();
    socket.emit('resStartGame', data);
  });

  var temp = undefined;
  socket.on('reqMove', function(targetPosition){
    user.setTargetPosition(targetPosition);
    user.setTargetDirection(targetPosition);
    user.stop();
    user.setSpeed();
    if(user.direction != user.targetDirection){
      user.rotate();
    }else{
      user.move();
    }
    var data = { position : user.position, targetPosition : user.targetPosition };
    socket.emit('resMove', data);
    clearInterval(temp);
    temp = setInterval(function(){
      // console.log('targetDirection : ' + user.targetDirection);
      // console.log('rotateSpeed : ' + user.rotateSpeed);
      console.log(user.targetPosition.x + ' : ' +  user.targetPosition.y);
      console.log(user.direction + ' : ' + user.position.x + ' : ' + user.position.y);
    }, 1000);
  })
  socket.on('disconnect', function(){
    if(user){
      user.stop();
      GM.kickUser(user);
    }
    console.log('user disconnect :' + socket.id);
  });
});
