'use strict';

var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var path = require('path');

var app = express();
var config = require('./config.json');
var gameConfig = require('./public/js/utils/gameConfig.json');
var util = require('./public/js/utils/util.js');

app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app);
var port = process.env.PORT || config.port;

server.listen(port, function(){
  console.log('Server is Running');
});

var GameManager = require('./modules/GameManager.js');
var GM = new GameManager();
var User = require('./modules/User.js');

var INTERVAL_TIMER = 1000/gameConfig.fps;

var io = socketio.listen(server);

io.on('connection', function(socket){
  console.log('user connect : ' + socket.id);
  var user = new User(socket.id);
  var updateUserInterval = false;
  var localConfig = {};
  socket.on('reqSetCanvasSize', function(windowSize){
    var scaleFactor = 1;

    if(windowSize.width >= config.canvasMaxLocalSize.width || windowSize.height >= config.canvasMaxLocalSize.height){
      scaleFactor = (windowSize.width / config.canvasMaxLocalSize.width) > (windowSize.height / config.canvasMaxLocalSize.height) ?
                    (windowSize.width / config.canvasMaxLocalSize.width) : (windowSize.height / config.canvasMaxLocalSize.height);
      // localConfig.canvasSize = {
      //   width : config.canvasMaxLocalSize.width,
      //   height : config.canvasMaxLocalSize.height
      // };
    }
    localConfig.canvasSize = windowSize;

    socket.emit('resSetCanvasSize', localConfig.canvasSize, scaleFactor);
  });
  socket.on('reqStartGame', function(){
    // initialize and join GameManager
    // user.initialize();
    GM.initializeUser(user);
    GM.joinUser(user);

    //update user data
    if(!updateUserInterval){
      updateUserInterval = setInterval(function(){ GM.updateUser(user); }, INTERVAL_TIMER);
    }
    var data = GM.updateDataSetting(user);
    socket.emit('setCorrespondUser', data);
    socket.broadcast.emit('userJoined', data);

    var datas = GM.updateDataSettings();
    console.log(datas);

    socket.emit('resStartGame', datas);
  });

  socket.on('reqMove', function(targetPosition, localOffset, tempPacket){
    console.log(user.position);
    console.log(user.targetPosition);

    var newPosition = util.localToWorldPosition(tempPacket.position, localOffset);
    console.log(newPosition);
    var newTargetPosition = util.localToWorldPosition(tempPacket.targetPosition, localOffset);
    console.log(newTargetPosition);
    
    var newTargetPosition = util.localToWorldPosition(targetPosition, localOffset);
    GM.setUserTargetAndMove(user, newTargetPosition);

    var data = GM.updateDataSetting(user);
    io.sockets.emit('resMove', data);
  })

  socket.on('disconnect', function(){
    if(user){
      GM.stopUser(user);
      GM.kickUser(user);
      user = null;
    }
    if(updateUserInterval){
      clearInterval(updateUserInterval);
      updateUserInterval = false;
    }
    console.log('user disconnect :' + socket.id);
  });
});
