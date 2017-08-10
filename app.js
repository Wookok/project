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
var serverConfig = require('./modules/server/serverConfig.json');

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

GM.onNeedInformCreateObjs = function(objs){
  var objDatas = [];
  for(var i=0; i<Object.keys(objs).length; i++){
    objDatas.push(GM.processOBJDataSetting(objs[i]));
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
GM.onNeedInformProjectileExplode = function(projectileData){
  io.sockets.emit('explodeProjectile', projectileData.objectID);
};

GM.onNeedInformCreateChest = function(chest){
  var chestData = GM.processChestDataSetting(chest);
  io.sockets.emit('createChest', chestData);
};

io.on('connection', function(socket){
  console.log('user connect : ' + socket.id);

  var user = new User(socket.id, userBaseTable[0], 0);

  socket.on('reqStartGame', function(){

    // user init and join game
    GM.initializeUser(user);
    GM.joinUser(user);

    //update user data


    var userData = GM.processUserDataSetting(user);
    //send users user joined game
    socket.broadcast.emit('userJoined', userData);

    var userDatas = GM.processUserDataSettings();
    console.log(userDatas);
    var skillDatas = GM.processSkillsDataSettings();
    var projectileDatas = GM.processProjectilesDataSettings();
    var objDatas = GM.processOBJDataSettings();
    var chestDatas = GM.processChestDataSettings();

    socket.emit('setSyncUser', userData);
    socket.emit('resStartGame', userDatas, skillDatas, projectileDatas, objDatas, chestDatas);
  });

  socket.on('userDataUpdate', function(userData){
    var rand = Math.floor(Math.random() * serverConfig.CHEAT_CHECK_RATE);
    if(rand === 1){
      if(GM.checkCheat(userData)){
        console.log('is not cheating!');
      }else{
        console.log(userData.objectID + ' is cheating!!!!!');
      }
    }
    GM.updateUserData(userData);
  });
  socket.on('userMoveStart', function(userData){
    GM.updateUserData(userData);

    var userData = GM.processUserDataSetting(user);
    socket.broadcast.emit('userDataUpdate', userData);
  });
  socket.on('userUseSkill', function(userAndSkillData){
    GM.updateUserData(userAndSkillData);
    var userData = GM.processUserDataSetting(user);
    userData.skillIndex = userAndSkillData.skillIndex;
    userData.skillDirection = userAndSkillData.skillDirection;
    userData.skillTargetPosition = userAndSkillData.skillTargetPosition;
    if(userAndSkillData.projectileID){
      userData.skillProjectileID = userAndSkillData.projectileID;
    }
    socket.broadcast.emit('userDataUpdateAndUseSkill', userData);
  });
  socket.on('skillFired', function(data){
    var skillData = util.findData(skillTable, 'index', data.skillIndex);

    skillData.targetPosition = data.skillTargetPosition;

    skillData.buffsToSelf = util.findAndSetBuffs(skillData, buffTable, 'buffToSelf', 3);
    skillData.buffsToTarget = util.findAndSetBuffs(skillData, buffTable, 'buffToTarget', 3);
    skillData.debuffsToSelf = util.findAndSetBuffs(skillData, buffTable, 'debuffToSelf', 3);
    skillData.debuffsToTarget = util.findAndSetBuffs(skillData, buffTable, 'debuffToTarget', 3);

    GM.applySkill(user.objectID, skillData);
  });
  socket.on('projectileFired', function(data){
    var projectileData = util.findData(skillTable, 'index', data.skillIndex);

    projectileData.objectID = data.objectID;
    projectileData.position = data.position;
    projectileData.speed = data.speed;
    projectileData.startTime = data.startTime;
    projectileData.lifeTime = data.lifeTime;

    projectileData.buffsToSelf = util.findAndSetBuffs(projectileData, buffTable, 'buffToSelf', 3);
    projectileData.buffsToTarget = util.findAndSetBuffs(projectileData, buffTable, 'buffToTarget', 3);
    projectileData.debuffsToSelf = util.findAndSetBuffs(projectileData, buffTable, 'debuffToSelf', 3);
    projectileData.debuffsToTarget = util.findAndSetBuffs(projectileData, buffTable, 'debuffToTarget', 3);

    GM.applyProjectile(user.objectID, projectileData);
  });
  socket.on('disconnect', function(){
    if(user){
      io.sockets.emit('userLeave', user.objectID);
      GM.stopUser(user);
      GM.kickUser(user);
      user = null;
    }
    console.log('user disconnect :' + socket.id);
  });
});
