// inner Modules
var util = require('../../modules/public/util.js');
var User = require('../../modules/client/CUser.js');
var CManager = require('../../modules/client/CManager.js');
var gameConfig = require('../../modules/public/gameConfig.json');
// var resource = require('../../modules/public/resource.json');
var csvJson = require('../../modules/public/csvjson.js');
var dataJson = require('../../modules/public/data.json');

var userStatTable = csvJson.toObject(dataJson.userStatData, {delimiter : ',', quote : '"'});
var skillTable = csvJson.toObject(dataJson.skillData, {delimiter : ',', quote : '"'});
var buffGroupTable = csvJson.toObject(dataJson.buffGroupData, {delimiter : ',', quote : '"'});
var socket;

// document elements
// var startScene, gameScene, standingScene;
// var startButton;

var CUIManager = require('../../modules/client/CUIManager.js');
var UIManager;

var canvas, ctx, scaleFactor;

// const var
var radianFactor = Math.PI/180;
var fps = 1000/60;
var INTERVAL_TIMER = 1000/gameConfig.INTERVAL;

// game var
var Manager;

// resource var
var resources;

var userImage, userHand;
var grid;

// game state var
var gameState = gameConfig.GAME_STATE_LOAD;
var gameSetupFunc = stateFuncLoad;
var gameUpdateFunc = null;

var latency = 0;
var drawInterval = false;
var userDataUpdateInterval = false;

//draw skills range, explosionRadius.
var drawMode = gameConfig.DRAW_MODE_NORMAL;
//use when draw mode skill.
var mousePoint = {x : 0, y : 0};
var currentSkillData = null;

var characterType = 1;

var firoBaseSkill = 0, firoInherentPassiveSkill = 0, firoEquipSkills = new Array(4),
    freezerBaseSkill = 0, freezerInherentPassiveSkill = 0, freezerEquipSkills = new Array(4),
    mysterBaseSkill = 0, mysterInherentPassiveSkill = 0, mysterEquipSkills = new Array(4);

var baseSkill = 0;
var baseSkillData = null;
var inherentPassiveSkill = 0;
var inherentPassiveSkillData = null;
var equipSkills = new Array(4);
var equipSkillDatas = new Array(4);
var possessSkills = [];

//state changer
function changeState(newState){
  clearInterval(drawInterval);
  clearInterval(userDataUpdateInterval);
  drawInterval = false;
  userDataUpdateInterval = false;

  switch (newState) {
    case gameConfig.GAME_STATE_LOAD:
      gameState = newState;
      gameSetupFunc = stateFuncLoad;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_START_SCENE:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = stateFuncStandby;
      break;
    case gameConfig.GAME_STATE_GAME_START:
      gameState = newState;
      gameSetupFunc = stateFuncStart;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_GAME_ON:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = stateFuncGame;
      break;
    case gameConfig.GAME_STATE_END:
      gameState = newState;
      gameSetupFunc = stateFuncEnd;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_RESTART_SCENE:
      gameState = newState;
      gameSetupFunc = null;
      gameUpdateFunc = stateFuncStandbyRestart;
      break;
    case gameConfig.GAME_STATE_RESTART:
      gameState = newState;
      gameSetupFunc = stateFuncRestart;
      gameUpdateFunc = null;
      break;
  }
  update();
};

function update(){
  if(gameSetupFunc === null && gameUpdateFunc !== null){
    drawInterval = setInterval(gameUpdateFunc,fps);
  }else if(gameSetupFunc !==null && gameUpdateFunc === null){
    gameSetupFunc();
  }
};

//load resource, base setting
function stateFuncLoad(){
  setBaseSetting();
  setCanvasSize();
  window.onresize = function(){
    setCanvasSize();
  };
  UIManager.setSkillChangeBtn();
  changeState(gameConfig.GAME_STATE_START_SCENE);
};
//when all resource loaded. just draw start scene
function stateFuncStandby(){
  drawStartScene();
};
//if start button clicked, setting game before start game
//setup socket here!!! now changestates in socket response functions
function stateFuncStart(){
  UIManager.disableStartScene();
  setupSocket();
  socket.emit('reqStartGame', characterType);
};
//game play on
function stateFuncGame(){
  drawGame();
};
//show end message and restart button
function stateFuncEnd(){
  //should init variables
  canvasDisableEvent();
  documentDisableEvent();
  UIManager.initStandingScene();
  changeState(gameConfig.GAME_STATE_RESTART_SCENE);
};
function stateFuncStandbyRestart(){
  drawRestartScene();
}
function stateFuncRestart(){
  socket.emit('reqRestartGame', characterType);
};
//functions
function setBaseSetting(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  UIManager = new CUIManager(skillTable, buffGroupTable);
  UIManager.onStartBtnClick = function(charType, clickButton){
    characterType = charType;
    if(clickButton === gameConfig.START_BUTTON){
      changeState(gameConfig.GAME_STATE_GAME_START);
    }else if(clickButton === gameConfig.RESTART_BUTTON){
      changeState(gameConfig.GAME_STATE_RESTART);
    }
  };
  UIManager.onSkillUpgrade = function(skillIndex){
    socket.emit('upgradeSkill', skillIndex);
  };
  UIManager.onExchangePassive = function(beforeBuffGID, afterBuffGID){
    socket.emit('exchangePassive', beforeBuffGID, afterBuffGID);
  };
  UIManager.onEquipPassive = function(buffGroupIndex){
    console.log('equip Passive : ' + buffGroupIndex);
    socket.emit('equipPassive', buffGroupIndex);
  };
  UIManager.onUnequipPassive = function(buffGroupIndex){
    console.log('unequip Passive : ' + buffGroupIndex);
    socket.emit('unequipPassive', buffGroupIndex);
  };

  UIManager.initStartScene();
  UIManager.initHUD();
  UIManager.initPopUpSkillChanger();

  // inner Modules
  util = require('../../modules/public/util.js');
  User = require('../../modules/client/CUser.js');
  CManager = require('../../modules/client/CManager.js');
  gameConfig = require('../../modules/public/gameConfig.json');

  Manager = new CManager(gameConfig);
  Manager.onSkillFire = onSkillFireHandler;
  Manager.onProjectileSkillFire = onProjectileSkillFireHandler;
  Manager.onCancelCasting = onCancelCastingHandler;
  // resource 관련
  resources = require('../../modules/public/resources.json');

  userImage = new Image();
  userHand = new Image();
  grid = new Image();
  userImage.src = resources.USER_BODY_SRC;
  userHand.src = resources.USER_HAND_SRC;
  grid.src = resources.GRID_SRC;
};
function onSkillFireHandler(rawSkillData, syncFireTime){
  var skillData = Manager.processSkillData(rawSkillData);
  skillData.syncFireTime = syncFireTime;
  socket.emit('skillFired', skillData);
};
function onProjectileSkillFireHandler(rawProjectileDatas, syncFireTime){
  var projectileDatas = Manager.processProjectileData(rawProjectileDatas);
  console.log(rawProjectileDatas);
  socket.emit('projectilesFired', projectileDatas, syncFireTime);
};
function onCancelCastingHandler(){
  var userData = Manager.processUserData();
  socket.emit('castCanceled', userData);
};
function setCanvasSize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  gameConfig.canvasSize = {width : window.innerWidth, height : window.innerHeight};
  setCanvasScale(gameConfig);
};

function drawStartScene(){
  UIManager.drawStartScene();
};

function drawGame(){
  UIManager.drawGameScene();

  var startTime = Date.now();

  gameConfig.userOffset = calcOffset();

  drawScreen();
  // drawBackground();
  drawGrid();
  drawObstacles();
  drawChests();
  drawObjs();
  drawUsers();
  drawEffect();
  drawProjectile();
  if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
    drawSkillRange();
  }
  // console.log(Date.now() - startTime);
};

function drawRestartScene(){
  UIManager.drawRestartScene();
};

// socket connect and server response configs
function setupSocket(){
  socket = io();

  socket.on('connect', function(){
    console.log('connection to the server');
  });
  socket.on('disconnect', function(){
    console.log('disconnected');
    changeState(gameConfig.GAME_STATE_RESTART_SCENE);
  });
  socket.on('pong', function(lat){
    latency = lat;
  });

  socket.on('syncAndSetSkills', function(user){
    //synchronize user
    var startTime = Date.now();
    gameConfig.userID = user.objectID;
    gameConfig.userOffset = util.calculateOffset(user, gameConfig.canvasSize);

    baseSkill = user.baseSkill;
    baseSkillData = Object.assign({}, util.findData(skillTable, 'index', user.baseSkill));
    inherentPassiveSkill = user.inherentPassiveSkill;
    inherentPassiveSkillData = Object.assign({}, util.findData(skillTable, 'index', user.inherentPassiveSkill));
    for(var i=0; i<4; i++){
      if(user.equipSkills[i]){
        equipSkills[i] = user.equipSkills[i];
      }else{
        equipSkills[i] = undefined;
      }
    }
    for(var i=0; i<4; i++){
      if(user.equipSkills[i]){
        equipSkillDatas[i] = Object.assign({}, util.findData(skillTable, 'index', user.equipSkills[i]));
      }else{
        equipSkillDatas[i] = undefined;
      }
    };

    possessSkills = user.possessSkills;

    UIManager.syncSkills(baseSkill, baseSkillData, equipSkills, equipSkillDatas, possessSkills, inherentPassiveSkill, inherentPassiveSkillData);
    UIManager.setHUDSkills();
    UIManager.updateBuffIcon();
    UIManager.setHUDStats(user.statPower, user.statMagic, user.statSpeed);
    UIManager.setCooldownReduceRate(user.cooldownReduceRate);
    UIManager.setPopUpSkillChange();
  });

  //change state game on
  socket.on('resStartGame', function(userDatas, objDatas, chestDatas){
    Manager.setUsers(userDatas);
    // Manager.setUsersSkills(skillDatas);
    // Manager.setProjectiles(projectileDatas);
    Manager.setObjs(objDatas);
    Manager.setChests(chestDatas);

    Manager.synchronizeUser(gameConfig.userID);
    Manager.start();
    console.log(Manager.users);

    canvasAddEvent();
    documentAddEvent();

    changeState(gameConfig.GAME_STATE_GAME_ON);
    userDataUpdateInterval = setInterval(updateUserDataHandler, INTERVAL_TIMER);
  });
  socket.on('resRestartGame', function(userData){
    //do here
  });
  socket.on('userJoined', function(data){
    Manager.setUser(data);
    console.log('user joined ' + data.objectID);
  });
  socket.on('userDataUpdate', function(userData){
    console.log(userData);
    Manager.updateUserData(userData);
  });
  socket.on('userDataUpdateAndUseSkill', function(userData){
    Manager.updateUserData(userData);
    var skillData = Object.assign({}, util.findData(skillTable, 'index', userData.skillIndex));

    Manager.applyCastSpeed(userData.objectID, skillData);
    skillData.targetPosition = userData.skillTargetPosition;
    skillData.direction = userData.skillDirection;
    if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE ||
       skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK ||
       skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION ||
       skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION ||
       skillData.type === gameConfig.SKILL_TYPE_INSTANT_PROJECTILE){
      skillData.projectileIDs = userData.skillProjectileIDs;
    }
    Manager.useSkill(userData.objectID, skillData);
  });
  socket.on('skillFired', function(data, userID){
    var timeoutTime = data.syncFireTime - Date.now();
    if(timeoutTime < 0){
      timeoutTime = 0;
    }
    setTimeout(function(){
      var skillData = Object.assign({}, util.findData(skillTable, 'index', data.skillIndex));
      skillData.targetPosition = data.skillTargetPosition;
      if(userID === gameConfig.userID){
        UIManager.applySkill(skillData.index);
      }
      Manager.applySkill(skillData);
    }, timeoutTime);
  });
  socket.on('projectilesFired', function(datas, syncFireTime, userID){
    var timeoutTime = syncFireTime - Date.now();
    if(timeoutTime < 0){
      timeoutTime = 0;
    }
    setTimeout(function(){
      for(var i=0; i<datas.length; i++){
        var skillData = Object.assign({}, util.findData(skillTable, 'index', datas[i].skillIndex));
        skillData.userID = userID;
        skillData.objectID = datas[i].objectID;
        skillData.position = datas[i].position;
        skillData.speed = datas[i].speed;
        skillData.startTime = Date.now();

        if(userID == gameConfig.userID){
          UIManager.applySkill(skillData.index);
        }
        Manager.applyProjectile(skillData);
      }
    }, timeoutTime);
  });
  socket.on('upgradeSkill', function(beforeSkillIndex, afterSkillIndex){
    if(beforeSkillIndex === baseSkill){
      baseSkill = afterSkillIndex;
      baseSkillData = Object.assign({}, util.findData(skillTable, 'index', afterSkillIndex));
      UIManager.upgradeBaseSkill(baseSkill, baseSkillData);
    }else if(beforeSkillIndex === inherentPassiveSkill){
      inherentPassiveSkill = afterSkillIndex;
      inherentPassiveSkillData = Object.assign({}, util.findData(skillTable, 'index', afterSkillIndex));
      UIManager.upgradeInherentSkill(inherentPassiveSkill, inherentPassiveSkillData);
    }else{
      for(var i=0; i<possessSkills.length; i++){
        if(possessSkills[i] === beforeSkillIndex){
          UIManager.upgradePossessionSkill(beforeSkillIndex, afterSkillIndex);
          break;
        }
      }
    }
    updateCharTypeSkill();
  });
  socket.on('updateUserPrivateStat', function(statData){
    UIManager.setHUDStats(statData.statPower, statData.statMagic, statData.statSpeed);
    UIManager.setCooldownReduceRate(statData.cooldownReduceRate);
  });
  socket.on('deleteProjectile', function(projectileID, userID){
    Manager.deleteProjectile(projectileID, userID);
  });
  socket.on('explodeProjectile', function(projectileID, userID){
    Manager.explodeProjectile(projectileID, userID);
  });
  socket.on('castCanceled', function(userID){
    Manager.cancelCasting(userID);
  });
  socket.on('createOBJs', function(objDatas){
    Manager.createOBJs(objDatas);
  });
  socket.on('deleteOBJ', function(objID){
    Manager.deleteOBJ(objID);
  });
  socket.on('createChest', function(chestData){
    console.log(chestData);
    Manager.createChest(chestData);
  });
  socket.on('changeUserStat', function(userData){
    Manager.changeUserStat(userData);
    if(userData.objectID === gameConfig.userID){
      UIManager.updateHP(userData);
      UIManager.updateMP(userData);

      var needExp = Object.assign({}, util.findDataWithTwoColumns(userStatTable, 'type', characterType, 'level', userData.level)).needExp;
      UIManager.updateExp(userData, needExp);
    }
  });
  socket.on('userDamaged', function(userData){
    Manager.changeUserStat(userData);
    if(userData.objectID === gameConfig.userID){
      UIManager.updateHP(userData);
    }
  });
  socket.on('updateBuff', function(buffData){
    UIManager.updateBuffIcon(buffData.passiveList, buffData.buffList);
  })
  socket.on('updateSkillPossessions', function(possessSkillIndexes){
    Manager.updateSkillPossessions(gameConfig.userID, possessSkillIndexes);
    possessSkills = possessSkillIndexes;
    UIManager.updatePossessionSkills(possessSkills);
    UIManager.setPopUpSkillChange();
  });
  socket.on('userLeave', function(objID){
    Manager.kickUser(objID);
  });
};

//draw
function drawScreen(){
  //draw background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
function drawObstacles(){

  for(var i=0; i<Manager.obstacles.length; i++){
    ctx.beginPath();
    if(Manager.obstacles[i].staticEle.isCollide){
      ctx.fillStyle ="#ff0000";
    }else{
      ctx.fillStyle ="#000000";
    }
    var center = util.worldToLocalPosition(Manager.obstacles[i].center, gameConfig.userOffset);
    ctx.arc(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor,
            resources.OBJ_TREE_SIZE/2 * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
    ctx.closePath();
    // ctx.fillRect(Manager.obstacles[index].staticEle.x, Manager.obstacles[index].staticEle.y, resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE);
  }
};
function drawChests(){
  ctx.fillStyle = "#00ff00";
  for(var i=0; i<Manager.chests.length; i++){
    ctx.beginPath();
    var pos = util.worldToLocalPosition(Manager.chests[i].position, gameConfig.userOffset);
    ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor,
                  Manager.chests[i].size.width * gameConfig.scaleFactor, Manager.chests[i].size.height * gameConfig.scaleFactor);
    ctx.closePath();
  }
};
function drawObjs(){
  ctx.fillStyle = "#0000ff";
  for(var i=0; i<Manager.objGolds.length; i++){
    ctx.beginPath();
    var centerX = util.worldXCoordToLocalX(Manager.objGolds[i].position.x + Manager.objGolds[i].radius, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.objGolds[i].position.y + Manager.objGolds[i].radius, gameConfig.userOffset.y);
    ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objGolds[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    // var pos = util.worldToLocalPosition(Manager.objSkills[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
  ctx.fillStyle = "#00ff00";
  for(var i=0; i<Manager.objJewels.length; i++){
    ctx.beginPath();
    var centerX = util.worldXCoordToLocalX(Manager.objJewels[i].position.x + Manager.objJewels[i].radius, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.objJewels[i].position.y + Manager.objJewels[i].radius, gameConfig.userOffset.y);
    ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objJewels[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    // var pos = util.worldToLocalPosition(Manager.objSkills[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
  // for(var i=0; i<Manager.objExps.length; i++){
  //   ctx.beginPath();
  //   var centerX = util.worldXCoordToLocalX(Manager.objExps[i].position.x + Manager.objExps[i].radius, gameConfig.userOffset.x);
  //   var centerY = util.worldYCoordToLocalY(Manager.objExps[i].position.y + Manager.objExps[i].radius, gameConfig.userOffset.y);
  //   ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objExps[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
  //   ctx.fill();
  //   // var pos = util.worldToLocalPosition(Manager.objExps[i].position, gameConfig.userOffset);
  //   // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objExps[i].radius * 2 * gameConfig.scaleFactor, Manager.objExps[i].radius * 2 * gameConfig.scaleFactor);
  //   ctx.closePath();
  // };
  ctx.fillStyle = "#ff0000";
  for(var i=0; i<Manager.objSkills.length; i++){
    ctx.beginPath();
    var centerX = util.worldXCoordToLocalX(Manager.objSkills[i].position.x + Manager.objSkills[i].radius, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.objSkills[i].position.y + Manager.objSkills[i].radius, gameConfig.userOffset.y);
    ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.objSkills[i].radius * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    // var pos = util.worldToLocalPosition(Manager.objSkills[i].position, gameConfig.userOffset);
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
};
function drawUsers(){
  for(var index in Manager.users){
    if(Manager.users[index].conditions[gameConfig.USER_CONDITION_BLUR]){
      if(index === gameConfig.userID){
        ctx.globalAlpha = 0.6;
      }else{
        ctx.globalAlpha = 0.3;
      }
    }else{
      ctx.globalAlpha = 1;
    }
    var radian = Manager.users[index].direction * radianFactor;

    var centerX = util.worldXCoordToLocalX(Manager.users[index].position.x + Manager.users[index].size.width/2, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.users[index].position.y + Manager.users[index].size.height/2, gameConfig.userOffset.y);

    var center = util.worldToLocalPosition(Manager.users[index].center, gameConfig.userOffset);

    ctx.beginPath();
    ctx.fillStyle = "#ffff00";
    ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, 32 * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
    // ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.users[index].size.width * gameConfig.scaleFactor, Manager.users[index].size.width * gameConfig.scaleFactor);

    ctx.beginPath();
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    var center = util.worldToLocalPosition(Manager.users[index].center, gameConfig.userOffset);
    ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
    ctx.rotate(radian);
    ctx.fillStyle = 'yellow';
    ctx.arc(0, 0, 64 * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    //draw cast effect
    if(Manager.users[index].skillCastEffectPlay){
      ctx.fillStyle ="#00ff00";
      ctx.beginPath();
      ctx.arc(0, 0, 100, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }
    ctx.restore();
  }
};
function drawEffect(){
  for(var i=0; i<Manager.effects.length; i++){
    ctx.beginPath();
    ctx.fillStyle ="#ff0000";

    var centerX = util.worldXCoordToLocalX(Manager.effects[i].position.x + Manager.effects[i].radius, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.effects[i].position.y + Manager.effects[i].radius, gameConfig.userOffset.y);
    ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.effects[i].radius * gameConfig.scaleFactor, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
};
function drawProjectile(){
  for(var i=0; i<Manager.projectiles.length; i++){
    ctx.fillStyle ="#ff0000";
    ctx.beginPath();
    var centerX = util.worldXCoordToLocalX(Manager.projectiles[i].position.x + Manager.projectiles[i].radius, gameConfig.userOffset.x);
    var centerY = util.worldYCoordToLocalY(Manager.projectiles[i].position.y + Manager.projectiles[i].radius, gameConfig.userOffset.y);
    ctx.arc(centerX * gameConfig.scaleFactor, centerY * gameConfig.scaleFactor, Manager.projectiles[i].radius * gameConfig.scaleFactor, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
};
function drawSkillRange(){
  ctx.beginPath();
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.8;
  var center = util.worldToLocalPosition(Manager.users[gameConfig.userID].center, gameConfig.userOffset);
  ctx.arc(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor, currentSkillData.range * gameConfig.scaleFactor, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
  //draw explosionRadius
  ctx.beginPath();
  ctx.globalAlpha = 0.9;
  ctx.arc(mousePoint.x * gameConfig.scaleFactor, mousePoint.y * gameConfig.scaleFactor, currentSkillData.explosionRadius * gameConfig.scaleFactor, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1
};
// function drawBackground(){
//   // ctx.fillStyle = "#11ff11";
//   // var posX = -gameConfig.userOffset.x * gameConfig.scaleFactor;
//   // var posY = -gameConfig.userOffset.y * gameConfig.scaleFactor;
//   // var sizeW = gameConfig.CANVAS_MAX_SIZE.width * gameConfig.scaleFactor;
//   // var sizeH = gameConfig.CANVAS_MAX_SIZE.height * gameConfig.scaleFactor;
//   // ctx.fillRect(posX, posY, sizeW, sizeH);
// };
function drawGrid(){
  for(var i=0; i<gameConfig.CANVAS_MAX_SIZE.width; i += resources.GRID_SIZE){
    var x = util.worldXCoordToLocalX(i, gameConfig.userOffset.x);
    if(x * gameConfig.scaleFactor >= -resources.GRID_SIZE && x * gameConfig.scaleFactor <= gameConfig.canvasSize.width){
      for(var j=0; j<gameConfig.CANVAS_MAX_SIZE.height; j += resources.GRID_SIZE){
         var y = util.worldYCoordToLocalY(j, gameConfig.userOffset.y);
         if(y * gameConfig.scaleFactor >= -resources.GRID_SIZE && y * gameConfig.scaleFactor <= gameConfig.canvasSize.height){
           ctx.drawImage(grid, 0, 0, 48, 48, x * gameConfig.scaleFactor, y * gameConfig.scaleFactor, resources.GRID_IMG_SIZE * gameConfig.scaleFactor, resources.GRID_IMG_SIZE * gameConfig.scaleFactor);
         }
      }
    }
  }
 //  ctx.lineWidth = 1;
 //  ctx.strokeStyle = '#0000ff';
 //  ctx.globalAlpha = 0.15;
 //  ctx.beginPath();
 // // - (gameConfig.CANVAS_MAX_LOCAL_SIZE.width * gameConfig.scaleFactor)/2
 // //  - (gameConfig.CANVAS_MAX_LOCAL_SIZE.height * gameConfig.scaleFactor)/2
 //  for(var x = - gameConfig.userOffset.x; x<gameConfig.canvasSize.width; x += gameConfig.CANVAS_MAX_LOCAL_SIZE.width/32){
 //    if(util.isXInCanvas(x, gameConfig)){
 //      ctx.moveTo(x * gameConfig.scaleFactor, 0);
 //      ctx.lineTo(x * gameConfig.scaleFactor, gameConfig.canvasSize.height);
 //    }
 //  };
 //  for(var y = - gameConfig.userOffset.y; y<gameConfig.canvasSize.height; y += gameConfig.CANVAS_MAX_LOCAL_SIZE.height/20){
 //    if(util.isYInCanvas(y, gameConfig)){
 //      ctx.moveTo(0, y * gameConfig.scaleFactor);
 //      ctx.lineTo(gameConfig.canvasSize.width, y * gameConfig.scaleFactor);
 //    }
 //  };
 //  ctx.stroke();
 //  ctx.globalAlpha = 1;
 //  ctx.closePath();
};
function updateUserDataHandler(){
  var userData = Manager.processUserData();
  // userData.latency = latency;
  socket.emit('userDataUpdate', userData);
};
function canvasAddEvent(){
  canvas.addEventListener('click', canvasEventHandler, false);
};
function documentAddEvent(){
  document.addEventListener('keydown', documentEventHandler, false);
};
update();

var canvasEventHandler = function(e){
  var clickPosition ={
    x : e.clientX/gameConfig.scaleFactor,
    y : e.clientY/gameConfig.scaleFactor
  }
  var worldClickPosition = util.localToWorldPosition(clickPosition, gameConfig.userOffset);

  if(drawMode === gameConfig.DRAW_MODE_NORMAL){
    var targetPosition = util.setTargetPosition(worldClickPosition, Manager.users[gameConfig.userID]);
    Manager.moveUser(targetPosition);

    var userData = Manager.processUserData();
    userData.targetPosition = targetPosition;
    userData.latency = latency;
    socket.emit('userMoveStart', userData);
  }else if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
    useSkill(currentSkillData, worldClickPosition, Manager.users[gameConfig.userID]);
    changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
  }
};

var documentEventHandler = function(e){
  var keyCode = e.keyCode;
  var userPosition = Manager.users[gameConfig.userID].center;

  if(keyCode === 69 || keyCode === 32){
    if(UIManager.checkCooltime(gameConfig.SKILL_BASIC_INDEX)){
      var skillData = Object.assign({}, baseSkillData);
    }
  }else if(keyCode === 49){
    if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP1_INDEX)){
      skillData = Object.assign({}, equipSkillDatas[0]);
    }
  }else if(keyCode === 50){
    if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP2_INDEX)){
      skillData = Object.assign({}, equipSkillDatas[1]);
    }
  }else if(keyCode === 51){
    if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP3_INDEX)){
      skillData = Object.assign({}, equipSkillDatas[2]);
    }
  }else if(keyCode === 52){
    if(UIManager.checkCooltime(gameConfig.SKILL_EQUIP4_INDEX)){
      skillData = Object.assign({}, equipSkillDatas[3]);
    }
  }

  if(skillData){
    if(Manager.user.MP > skillData.consumeMP){
      Manager.applyCastSpeed(gameConfig.userID, skillData);
      if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION
        || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION
        || skillData.type === gameConfig.SKILL_TYPE_RANGE){
        if(drawMode === gameConfig.DRAW_MODE_NORMAL){
          currentSkillData = skillData;
          changeDrawMode(gameConfig.DRAW_MODE_SKILL_RANGE);
        }
      }else{
        useSkill(skillData, userPosition, Manager.users[gameConfig.userID]);
      }
    }else{
      if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
        changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
      }
    }
  }else if(drawMode === gameConfig.DRAW_MODE_SKILL_RANGE){
    changeDrawMode(gameConfig.DRAW_MODE_NORMAL);
  }
};
function changeDrawMode(mode){
  if(mode === gameConfig.DRAW_MODE_NORMAL){
    drawMode = gameConfig.DRAW_MODE_NORMAL;
    currentSkillData = null;
    canvas.removeEventListener('mousemove', mouseMoveHandler);
  }else if(mode === gameConfig.DRAW_MODE_SKILL_RANGE){
    drawMode = gameConfig.DRAW_MODE_SKILL_RANGE;
    canvas.addEventListener('mousemove', mouseMoveHandler, false);
  }
};
function mouseMoveHandler(e){
  mousePoint.x = e.clientX/gameConfig.scaleFactor;
  mousePoint.y = e.clientY/gameConfig.scaleFactor;
};
function useSkill(skillData, clickPosition, user){
  if(!user.conditions[gameConfig.USER_CONDITION_FREEZE] && !user.conditions[gameConfig.USER_CONDITION_SILENCE]){
    skillData.targetPosition = util.calcSkillTargetPosition(skillData, clickPosition, user);
    skillData.direction = util.calcSkillTargetDirection(skillData.type, skillData.targetPosition, user);
    if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK ||
      skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_EXPLOSION || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK_EXPLOSION
      || skillData.type === gameConfig.SKILL_TYPE_INSTANT_PROJECTILE){
        skillData.projectileIDs = util.generateRandomUniqueID(Manager.projectiles, gameConfig.PREFIX_SKILL_PROJECTILE, skillData.projectileCount);
      }
      Manager.useSkill(gameConfig.userID, skillData);

      var userData = Manager.processUserData();
      userData.skillIndex = skillData.index;
      userData.skillDirection = skillData.direction;
      userData.skillTargetPosition = skillData.targetPosition;
      if(skillData.projectileIDs){
        userData.projectileIDs = skillData.projectileIDs;
      }
      if(user.conditions[gameConfig.USER_CONDITION_BLUR]){
        userData.cancelBlur = true;
      }
      console.log(userData);
      socket.emit('userUseSkill', userData);
  }
};
function updateCharTypeSkill(){
  switch (characterType) {
    case gameConfig.CHAR_TYPE_FIRE:
      firoBaseSkill = baseSkill;
      firoInherentPassiveSkill = inherentPassiveSkill;
      for(var i=0; i<equipSkills.length; i++){
        firoEquipSkills[i] = equipSkills[i];
      }
      break;
    case gameConfig.CHAR_TYPE_FROST:
      freezerBaseSkill = baseSkill;
      freezerInherentPassiveSkill = inherentPassiveSkill;
      for(var i=0; i<equipSkills.length; i++){
        freezerEquipSkills[i] = equipSkills[i];
      }
      break;
    case gameConfig.CHAR_TYPE_ARCANE:
      mysterBaseSkill = baseSkill;
      mysterInherentPassiveSkill = inherentPassiveSkill;
      for(var i=0; i<equipSkills.length; i++){
        mysterEquipSkills[i] = equipSkills[i];
      }
      break;
  }
};
function canvasDisableEvent(){
  canvas.removeEventListener('click', canvasEventHandler);
};
function documentDisableEvent(){
  document.removeEventListener('keydown', documentEventHandler);
};
function setCanvasScale(gameConfig){
  gameConfig.scaleX = 1;
  gameConfig.scaleY = 1;
  if(gameConfig.canvasSize.width >= gameConfig.CANVAS_MAX_LOCAL_SIZE.width){
    gameConfig.scaleX =  (gameConfig.canvasSize.width / gameConfig.CANVAS_MAX_LOCAL_SIZE.width);
  }
  if(gameConfig.canvasSize.height >= gameConfig.CANVAS_MAX_LOCAL_SIZE.height){
    gameConfig.scaleY = (gameConfig.canvasSize.height / gameConfig.CANVAS_MAX_LOCAL_SIZE.height);
  }
  if(gameConfig.scaleX > gameConfig.scaleY){
    gameConfig.scaleFactor = gameConfig.scaleX;
  }else{
    gameConfig.scaleFactor = gameConfig.scaleY;
  }
};
function calcOffset(){
  return {
    x : Manager.user.center.x - gameConfig.canvasSize.width/(2 * gameConfig.scaleFactor),
    y : Manager.user.center.y - gameConfig.canvasSize.height/(2 * gameConfig.scaleFactor)
  };
};
