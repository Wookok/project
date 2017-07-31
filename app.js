'use strict';

var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var path = require('path');
var fs = require('fs');
var csvJson = require('./modules/public/csvjson.js');

var app = express();

var config = require('./config.json');
var gameConfig = require('./modules/public/gameConfig.json');

var dataJson = require('./modules/public/data.json');
var csvJsonOption = {delimiter : ',', quote : '"'};

var skillTable = csvJson.toObject(dataJson.skillData, csvJsonOption);
var userBaseTable = csvJson.toObject(dataJson.userBaseData, csvJsonOption);
var buffTable = csvJson.toObject(dataJson.buffData, csvJsonOption);

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

GM.onNeedUserInform = function(userID){
  var userData = GM.updateDataSetting(GM.users[userID]);
  socket.emit('updateUser', userData);
};
GM.onNeedUserInformToAll = function(userID){
  var userData = GM.updateDataSetting(GM.users[userID]);
  io.sockets.emit('updateUser', userData);
};
GM.onNeedProjectileSkillInformToAll = function(projectile){
  var projectileData = GM.updateProjectileDataSetting(projectile);
  io.sockets.emit('setProjectile', projectileData);
};
GM.onNeedInformCreateObjs = function(objs){
  var objDatas = [];
  for(var i=0; i<Object.keys(objs).length; i++){
    objDatas.push(GM.updateOBJDataSetting(objs[i]));
  }
  io.sockets.emit('createOBJs', objDatas);
  console.log('createObjs executed');
}
GM.onNeedInformDeleteObj = function(objID){
  console.log('onNeedInformDeleteObj : ' + objID);
  io.sockets.emit('deleteOBJ', objID)
};
GM.onNeedInformSkillData = function(socketID, possessSkills){
  io.to(socketID).emit('updateSkillPossessions', possessSkills);
  // socket.emit('updateSkillPossessions', possessSkills);
};

io.on('connection', function(socket){
  console.log('user connect : ' + socket.id);

  var user = new User(socket.id, userBaseTable[0], 0);
  var updateUserInterval = false;
  //
  // GM.onNeedUserInform = function(userID){
  //   var userData = GM.updateDataSetting(GM.users[userID]);
  //   socket.emit('updateUser', userData);
  // };
  // GM.onNeedUserInformToAll = function(userID){
  //   var userData = GM.updateDataSetting(GM.users[userID]);
  //   io.sockets.emit('updateUser', userData);
  // };
  // GM.onNeedProjectileSkillInformToAll = function(projectile){
  //   var projectileData = GM.updateProjectileDataSetting(projectile);
  //   io.sockets.emit('setProjectile', projectileData);
  // };
  // GM.onNeedInformCreateObjs = function(objs){
  //   var objDatas = [];
  //   for(var i=0; i<Object.keys(objs).length; i++){
  //     objDatas.push(GM.updateOBJDataSetting(objs[i]));
  //   }
  //   io.sockets.emit('createOBJs', objDatas);
  //   console.log('createObjs executed');
  // }
  // GM.onNeedInformDeleteObj = function(objID){
  //   console.log('onNeedInformDeleteObj : ' + objID);
  //   io.sockets.emit('deleteOBJ', objID)
  // };
  // GM.onNeedInformSkillData = function(userID, possessSkills){
  //   if(user.objectID === userID){
  //     socket.emit('updateSkillPossessions', possessSkills);
  //   }
  // }

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
    var skillDatas = GM.updateSkillsDataSettings();
    var projectileDatas = GM.updateProjectilesDataSettings();
    var objDatas = GM.updateOBJDataSettings();

    socket.emit('setSyncUser', userData);
    socket.emit('resStartGame', userDatas, skillDatas, projectileDatas, objDatas);
  });

  socket.on('reqMove', function(targetPosition, localOffset){
    // var newTargetPosition = util.localToWorldPosition(targetPosition, localOffset);
    GM.setUserTargetAndMove(user, targetPosition);

    var data = GM.updateDataSetting(user);
    io.sockets.emit('resMove', data);
  });

  socket.on('reqSkill', function(skillIndex, clickPosition){
    //find skill by index
    var skillData = util.findData(skillTable, 'index', skillIndex);
    if(skillData.type !== gameConfig.SKILL_TYPE_BASIC || !GM.checkStateIsAttack(user)){
      if(!clickPosition){
        clickPosition = user.center;
      }
      //find and set buffData, debuffData
      skillData.buffsToSelf = util.findAndSetBuffs(skillData, buffTable, 'buffToSelf', 3);
      skillData.buffsToTarget = util.findAndSetBuffs(skillData, buffTable, 'buffToTarget', 3);

      skillData.debuffsToSelf = util.findAndSetBuffs(skillData, buffTable, 'debuffToSelf', 3);
      skillData.debuffsToTarget = util.findAndSetBuffs(skillData, buffTable, 'debuffToTarget', 3);

      var skillInstance = GM.useSkill(user, skillData, clickPosition);

      var userData = GM.updateDataSetting(user);
      var skillInstanceData = GM.updateSkillDataSetting(skillInstance);
      io.sockets.emit('resSkill', userData, skillInstanceData);
    }
  });
  // socket.on('reqGetSkill', function(skillIndex){
  //   var skillData = util.findData(skillTable, 'index', skillIndex);
  //   //check skill possession
  //   var beforeSkillData = GM.checkSkillPossession(user, skillData);
  //   //check skill level up is possible
  //   if(beforeSkillData){
  //     if(skillData.nextSkillIndex !== -1){
  //       var newSkillIndex = skillData.nextSkillIndex;
  //       var newSkillData = util.findData(skillTable, 'index', newSkillIndex);
  //       var levelUpData = GM.levelUpSkill(user, beforeSkillData, newSkillData);
  //       socket.emit('resLevelUpSkill')
  //   }else{
  //     var newSkillIndex = GM.getSkill(user, newSkillData);
  //     socket.emit('resGetSkill');
  //   }
  // });
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
