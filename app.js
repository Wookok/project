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
  var user = new User(socket.id);
  var updateUserInterval = false;

  socket.on('reqStartGame', function(){
    // initialize and join GameManager
    user.initialize();
    GM.joinUser(user);

    //update user data
    if(!updateUserInterval){
      updateUserInterval = setInterval(function(){ GM.updateUser(user); }, 1000);
    }
    var data = GM.updateDataSetting(user);
    socket.broadcast.emit('userJoined', data);

    var datas = GM.updateDataSettings();
    socket.emit('resStartGame', datas);
  });

  var temp = undefined;
  socket.on('reqMove', function(targetPosition){
    GM.setUserTargetAndMove(user, targetPosition);

    var data = GM.updateDataSetting(user);
    // var data = { position : user.position, targetPosition : user.targetPosition };
    io.sockets.emit('resMove', data);

    //debug
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
    if(updateUserInterval){
      clearInterval(updateUserInterval);
      updateUserInterval = false;
    }
    console.log('user disconnect :' + socket.id);
  });
});
