'use strict';

var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var path = require('path');
var fs = require('fs');
var csvJson = require('csvjson');

var app = express();

var config = require('./config.json');
var gameConfig = require('./modules/public/gameConfig.json');
var dataJson = require('./modules/public/data.json');
var skillTable = csvJson.toObject(dataJson.skillData, {delimiter : ',', quote : '"'});
var skillData = require('./modules/public/skill.json');

// console.log(skillTable);
// var csvTest = fs.readFileSync(path.join(__dirname, '/modules/public/skill.csv'), { encoding : 'utf8'});
// console.log(csvJson.toObject(csvTest, {delimiter : ',', quote : '"'}));

var util = require('./modules/public/util.js');

app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app);
var port = process.env.PORT || config.port;

server.listen(port, function(){
  console.log('Server is Running');
});

var GameManager = require('./modules/server/GameManager.js');
var GM = new GameManager();

GM.start();

var User = require('./modules/server/User.js');

var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

var io = socketio.listen(server);

io.on('connection', function(socket){
  console.log('user connect : ' + socket.id);

  var user = new User(socket.id);
  var updateUserInterval = false;

  GM.onNeedInform = function(userID){
    var userData = GM.updateDataSetting(GM.users[userID]);
    socket.emit('updateUser', userData);
  };
  GM.onNeedInformToAll = function(userID){
    var userData = GM.updateDataSetting(GM.users[userID]);
    io.sockets.emit('updateUser', userData);
  }

  socket.on('reqStartGame', function(){

    // user init and join game
    GM.initializeUser(user);
    GM.joinUser(user);

    //update user data
    if(!updateUserInterval){
      updateUserInterval = setInterval(function(){ GM.updateUser(user); }, INTERVAL_TIMER);
    }

    var userData = GM.updateDataSetting(user);
    //send users user joined game
    socket.broadcast.emit('userJoined', userData);

    var userDatas = GM.updateDataSettings();
    console.log(userDatas);

    socket.emit('setSyncUser', userData);
    socket.emit('resStartGame', userDatas);
  });

  socket.on('reqMove', function(targetPosition, localOffset){
    // var newTargetPosition = util.localToWorldPosition(targetPosition, localOffset);
    GM.setUserTargetAndMove(user, targetPosition);

    var data = GM.updateDataSetting(user);
    io.sockets.emit('resMove', data);
  });

  socket.on('reqSkill', function(skill, clickPosition){
    //check user state and skill.type is OBJECT_STATE_ATTACK. if then do nothing
    if(skill.type !== gameConfig.SKILL_TYPE_BASIC || !GM.checkStateIsAttack(user)){
      if(skill.type === gameConfig.SKILL_TYPE_BASIC){
        skill = skillData.baseAttack;
      }else if(skill.type === gameConfig.SKILL_TYPE_INSTANT){
        skill = skillData.instantRangeSkill;
      }else if(skill.type === gameConfig.SKILL_TYPE_PROJECTILE){
        skill = skillData.projectileSkill;
      }else if(skill.type === gameConfig.SKILL_TYPE_SELF){
        skill = skillData.selfSkill;
      }
      var skillInstance = GM.useSkill(user, skill, clickPosition);

      var userData = GM.updateDataSetting(user);
      var skillInstanceData = GM.updateSkillDataSetting(skillInstance);

      io.sockets.emit('resSkill', userData, skillInstanceData);
    }
  });
  socket.on('disconnect', function(){
    if(user){
      io.sockets.emit('userLeave', user.objectID);
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
//
// //server util functions
// function setCanvasScale(windowSize, canvasMaxSize){
//   if(windowSize.width >= canvasMaxLocalSize.width || windowSize.height >= canvasMaxLocalSize.height){
//     var scaleFactor = (windowSize.width / canvasMaxLocalSize.width) > (windowSize.height / canvasMaxLocalSize.height) ?
//                   (windowSize.width / canvasMaxLocalSize.width) : (windowSize.height / canvasMaxLocalSize.height);
//     // localConfig.canvasSize = {
//     //   width : config.canvasMaxLocalSize.width,
//     //   height : config.canvasMaxLocalSize.height
//     // };
//   }
//   return 1;
// }
