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
var serverDataJson = require('./modules/server/serverData.json');
var csvJsonOption = {delimiter : ',', quote : '"'};

var userBaseTable = csvJson.toObject(serverDataJson.userBase, csvJsonOption);
var skillTable = csvJson.toObject(dataJson.skillData, csvJsonOption);
var userStatTable = csvJson.toObject(dataJson.userStatData, csvJsonOption);
// var buffTable = csvJson.toObject(dataJson.buffData, csvJsonOption);

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

GM.onNeedInformUserTakeDamage = function(user, dmg, skillIndex){
  var userData = GM.processChangedUserStat(user);
  userData.damagedAmount = dmg;
  io.sockets.emit('userDamaged', userData, skillIndex);
};
GM.onNeedInformUserDeath = function(attackUserID, deadUserID){
  var userDatas = GM.processScoreDatas();
  io.sockets.emit('userDead', attackUserID, deadUserID, userDatas);
};
GM.onNeedInformUserReduceMP = function(user){
  var userData = GM.processChangedUserStat(user);
  io.sockets.emit('changeUserStat', userData);
};
GM.onNeedInformUserGetExp = function(user){
  var userData = GM.processChangedUserStat(user);
  io.to(user.socketID).emit('changeUserStat', userData);
};
GM.onNeedInformUserGetResource = function(user){
  var resourceData = GM.processUserResource(user);
  io.to(user.socketID).emit('getResource', resourceData);
};
GM.onNeedInformUserLevelUp = function(user){
  var userData = GM.processChangedUserStat(user);
  io.sockets.emit('changeUserStat', userData);
};
GM.onNeedInformBuffUpdate = function(user){
  var buffData = GM.processBuffDataSetting(user);
  console.log(buffData);
  io.sockets.emit('updateBuff', buffData);
  // io.to(user.socketID).emit('updateBuff', buffData);
};
GM.onNeedInformSkillUpgrade = function(socketID, beforeSkillIndex, afterSkillIndex){
  io.to(socketID).emit('upgradeSkill', beforeSkillIndex, afterSkillIndex);
};
GM.onNeedInformUserChangePrivateStat = function(user){
  var statData = GM.processUserPrivateDataSetting(user);
  io.to(user.socketID).emit('updateUserPrivateStat', statData);
};
GM.onNeedInformUserChangeStat = function(user){
  var userData = GM.processChangedUserStat(user)
  // console.log(user.conditions);
  io.sockets.emit('changeUserStat', userData);
};
GM.onNeedInformCreateChest = function(chest){
  var chestData = GM.processChestDataSetting(chest);
  io.sockets.emit('createChest', chestData);
};
GM.onNeedInformDeleteChest = function(locationID){
  io.sockets.emit('deleteChest', locationID);
};
GM.onNeedInformCreateObjs = function(objs){
  var objDatas = [];
  for(var i=0; i<objs.length; i++){
    objDatas.push(GM.processOBJDataSetting(objs[i]));
  }
  io.sockets.emit('createOBJs', objDatas);
  console.log('createObjs executed');
};
GM.onNeedInformDeleteObj = function(objID){
  console.log('onNeedInformDeleteObj : ' + objID);
  io.sockets.emit('deleteOBJ', objID)
};
GM.onNeedInformSkillData = function(socketID, possessSkills){
  io.to(socketID).emit('updateSkillPossessions', possessSkills);
  // socket.emit('updateSkillPossessions', possessSkills);
};
GM.onNeedInformProjectileDelete = function(projectileData){
  io.sockets.emit('deleteProjectile', projectileData.objectID, projectileData.id);
};
GM.onNeedInformProjectileExplode = function(projectileData){
  io.sockets.emit('explodeProjectile', projectileData.objectID, projectileData.id, {x : projectileData.x, y : projectileData.y});
};

io.on('connection', function(socket){
  console.log('user connect : ' + socket.id);
  var user;
  socket.on('reqStartGame', function(userType){
    // console.log(userType);
    var userStat = Object.assign({}, util.findDataWithTwoColumns(userStatTable, 'type', userType, 'level', 1));
    var userBase = Object.assign({}, util.findData(userBaseTable, 'type', userType));
    user = new User(socket.id, userStat, userBase, 0);
    // console.log(user.type);
    var baseSkill = userBase.baseSkill;
    var equipSkills = [];
    for(var i=0; i<3; i++){
      if(userBase['baseEquipSkill' + (i + 1)]){
        equipSkills.push(userBase['baseEquipSkill' + (i + 1)]);
      }
    }
    var possessSkills = [];
    for(var i=0; i<4; i++){
      if(userBase['basePossessionSkill' + (i + 1)]){
        possessSkills.push(userBase['basePossessionSkill' + (i + 1)]);
      }
    }
    var inherentPassiveSkill = userBase.basePassiveSkill;

    possessSkills.push(31);
    possessSkills.push(41);
    possessSkills.push(51);
    possessSkills.push(61);
    possessSkills.push(71);
    possessSkills.push(81);
    // user init and join game
    GM.initializeUser(user, baseSkill, possessSkills, inherentPassiveSkill);
    GM.joinUser(user);
    var userData = GM.processUserDataSetting(user);
    var rankDatas = GM.processScoreDatas();
    //send users user joined game
    socket.broadcast.emit('userJoined', userData, rankDatas);

    var userDatas = GM.processUserDataSettings();
    // console.log(userDatas);
    // var skillDatas = GM.processSkillsDataSettings();
    // var projectileDatas = GM.processProjectilesDataSettings();
    var objDatas = GM.processOBJDataSettings();
    var chestDatas = GM.processChestDataSettings();

    GM.addSkillData(userData);
    GM.addPrivateData(userData);
    //user initial equip skill setting;
    userData.equipSkills = equipSkills;

    socket.emit('syncAndSetSkills', userData);
    socket.emit('resStartGame', userDatas, objDatas, chestDatas);
    GM.setStartBuff(user);
  });
  var count = 1;
  socket.on('reqRestartGame', function(charType, equipSkills){
    var level = GM.getLevel(user.objectID, charType);

    console.log(count++);
    var userStat = Object.assign({}, util.findDataWithTwoColumns(userStatTable, 'type', charType, 'level', level));
    var userBase = Object.assign({}, util.findData(userBaseTable, 'type', charType));
    GM.setUserStat(user.objectID, userStat, userBase);
    GM.setUserSkill(user.objectID, charType, userBase.baseSkill, userBase.basePassiveSkill);
    GM.startUserUpdate(user.objectID);
    var baseSkill = GM.getBaseSkill(user.objectID, charType);
    var inherentPassiveSkill = GM.getInherentPassiveSkill(user.objectID, charType);

    var userData = GM.processUserDataSetting(user);
    socket.broadcast.emit('userJoined', userData);
    GM.addSkillData(userData);
    GM.addPrivateData(userData);
    socket.emit('resRestartGame', userData);

    var passiveList = [];
    for(var i=0; i<equipSkills.length; i++){
      var skillData = Object.assign({}, util.findData(skillTable, 'index', equipSkills[i]));
      if(skillData.type === gameConfig.SKILL_TYPE_PASSIVE){
        passiveList.push(skillData.buffToSelf);
      }
    }
    GM.equipPassives(user.objectID, passiveList);
    GM.setStartBuff(user);
  });
  // var timeDelay = Date.now();
  socket.on('userDataUpdate', function(userData){
    // console.log(userData.time - timeDelay);
    // timeDelay = userData.time;
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
    if(userAndSkillData.cancelBlur){
      GM.cancelBlur(user.objectID);
    }
    var userData = GM.processUserDataSetting(user);
    userData.skillIndex = userAndSkillData.skillIndex;
    userData.skillDirection = userAndSkillData.skillDirection;
    userData.skillTargetPosition = userAndSkillData.skillTargetPosition;
    if(userAndSkillData.projectileIDs){
      userData.skillProjectileIDs = userAndSkillData.projectileIDs;
    }
    socket.broadcast.emit('userDataUpdateAndUseSkill', userData);
  });
  socket.on('skillFired', function(data){
    var skillData = Object.assign({}, util.findData(skillTable, 'index', data.skillIndex));
    skillData.targetPosition = data.skillTargetPosition;

    // skillData.buffsToSelf = util.findAndSetBuffs(skillData, buffTable, 'buffToSelf', 3, user.objectID);
    // skillData.buffsToTarget = util.findAndSetBuffs(skillData, buffTable, 'buffToTarget', 3, user.objectID);
    var timeoutTime = data.syncFireTime - Date.now();
    if(timeoutTime < 0){
      timeoutTime = 0;
    }
    setTimeout(function(){
      GM.applySkill(user.objectID, skillData);
    }, timeoutTime);
    io.sockets.emit('skillFired', data, user.objectID);
  });
  socket.on('projectilesFired', function(datas, syncFireTime){
    var timeoutTime = syncFireTime - Date.now();
    if(timeoutTime <0){
      timeoutTime = 0;
    }
    setTimeout(function(){
      var projectiles = [];
      for(var i=0; i<datas.length; i++){
        var projectileData = Object.assign({}, util.findData(skillTable, 'index', datas[i].skillIndex));

        projectileData.objectID = datas[i].objectID;
        projectileData.position = datas[i].position;
        projectileData.speed = datas[i].speed;
        projectileData.startTime = Date.now();

        projectiles.push(projectileData);
      }
      GM.applyProjectile(user.objectID, projectiles);
    }, timeoutTime);
    io.sockets.emit('projectilesFired', datas, syncFireTime, user.objectID);
  });
  socket.on('castCanceled', function(userData){
    GM.updateUserData(userData);

    socket.broadcast.emit('castCanceled', userData.objectID);
  });
  socket.on('upgradeSkill', function(skillIndex){
    GM.upgradeSkill(user, skillIndex);
  });
  socket.on('exchangePassive', function(beforeBuffGID, afterBuffGID){
    GM.exchangePassive(user, beforeBuffGID, afterBuffGID);
  });
  socket.on('equipPassive', function(buffGroupIndex){
    GM.equipPassive(user, buffGroupIndex);
  });
  socket.on('unequipPassive', function(buffGroupIndex){
    GM.unequipPassive(user, buffGroupIndex);
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
