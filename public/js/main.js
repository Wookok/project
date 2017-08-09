// inner Modules
var util = require('../../modules/public/util.js');
var User = require('../../modules/client/CUser.js');
var CManager = require('../../modules/client/CManager.js');
var gameConfig = require('../../modules/public/gameConfig.json');
// var resource = require('../../modules/public/resource.json');
var csvJson = require('../../modules/public/csvjson.js');
var dataJson = require('../../modules/public/data.json');
var skillTable = csvJson.toObject(dataJson.skillData, {delimiter : ',', quote : '"'});
var socket;

// document elements
var infoScene, gameScene, standingScene;
var startButton;

var canvas, ctx, scaleFactor;

// const var
var radianFactor = Math.PI/180;
var fps = 1000/60;

// game var
var Manager;

// resource var
var resources;

var userImage, userHand;
var grid;

// game state var
var gameState = gameConfig.GAME_STATE_LOAD;
var gameSetupFunc = load;
var gameUpdateFunc = null;

var latency = 0;
var drawInterval = false;
var userDataUpdateInterval = false;

//state changer
function changeState(newState){
  clearInterval(drawInterval);
  clearInterval(userDataUpdateInterval);
  drawInterval = false;
  userDataUpdateInterval = false;
  //
  // documentDisableEvent();
  // canvasDisableEvent();

  switch (newState) {
    case gameConfig.GAME_STATE_LOAD:
      gameState = newState;
      gameSetupFunc = load;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_START_SCENE:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = standby;
      break;
    case gameConfig.GAME_STATE_GAME_START:
      gameState = newState;
      gameSetupFunc = start;
      gameUpdateFunc = null;
      break;
    case gameConfig.GAME_STATE_GAME_ON:
      gameState = newState;
      gameSetupFunc = null
      gameUpdateFunc = game;
      break;
    case gameConfig.GAME_STATE_END:
      gameSate = newState;
      gameSetupFunc = null;
      gameUpdateFunc = end;
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
}

//load resource, base setting
function load(){
  setBaseSetting();
  setCanvasSize();
  //event handle config
  startButton.onclick = function(){
    changeState(gameConfig.GAME_STATE_GAME_START);
  };
  window.onresize = function(){
    setCanvasSize();
  };
  changeState(gameConfig.GAME_STATE_START_SCENE);
};
//when all resource loaded. just draw start scene
function standby(){
  drawStartScene();
};
//if start button clicked, setting game before start game
//setup socket here!!! now changestates in socket response functions
function start(){
  setupSocket();
  socket.emit('reqStartGame');
};
//game play on
function game(){
  drawGame();
};
//show end message and restart button
function end(){
  canvasDisableEvent();
  documentDisableEvent();
  changeState(gameConfig.GAME_STATE_START_SCENE);
};

//functions
function setBaseSetting(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  infoScene = document.getElementById('infoScene');
  gameScene = document.getElementById('gameScene');
  standingScene = document.getElementById('standingScene');
  startButton = document.getElementById('startButton');

  // inner Modules
  util = require('../../modules/public/util.js');
  User = require('../../modules/client/CUser.js');
  CManager = require('../../modules/client/CManager.js');
  gameConfig = require('../../modules/public/gameConfig.json');

  Manager = new CManager(gameConfig);
  Manager.onSkillFire = onSkillFireHandler;
  Manager.onProjectileSkillFire = onProjectileSkillFireHandler;
  // resource 관련
  resources = require('../../modules/public/resource.json');

  userImage = new Image();
  userHand = new Image();
  grid = new Image();
  userImage.src = resources.USER_BODY_SRC;
  userHand.src = resources.USER_HAND_SRC;
  grid.src = resources.GRID_SRC;
};
function onSkillFireHandler(rawSkillData){
  var skillData = Manager.processSkillData(rawSkillData);
  socket.emit('skillFired', skillData);
};
function onProjectileSkillFireHandler(rawProjectileData){
  var projectileData = Manager.processProjectileData(rawProjectileData);
  socket.emit('projectileFired', projectileData);
};
function setCanvasSize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  gameConfig.canvasSize = {width : window.innerWidth, height : window.innerHeight};
  setCanvasScale(gameConfig);
};

function drawStartScene(){
  infoScene.classList.add('enable');
  infoScene.classList.remove('disable');
  gameScene.classList.add('disable');
  gameScene.classList.remove('enable');
  standingScene.classList.add('disable');
  standingScene.classList.remove('enable');
};

function drawGame(){
  infoScene.classList.add('disable');
  infoScene.classList.remove('enable');
  gameScene.classList.add('enable');
  gameScene.classList.remove('disable');
  standingScene.classList.add('disable');
  standingScene.classList.remove('enable');

  gameConfig.userOffset = calcOffset();

  drawScreen();
  drawBackground();
  drawGrid();
  drawObstacles();
  drawChests();
  drawObjs();
  drawUsers();
  drawEffect();
  drawProjectile();
};

// socket connect and server response configs
function setupSocket(){
  socket = io();

  socket.on('connect', function(){
    console.log('connection to the server');
  });
  socket.on('disconnect', function(){
    console.log('disconnected');
    changeState(gameConfig.GAME_STATE_END);
  });
  socket.on('pong', function(lat){
    latency = lat + 300;
  });

  socket.on('setSyncUser', function(user){
    gameConfig.userID = user.objectID;
    gameConfig.userOffset = util.calculateOffset(user, gameConfig.canvasSize);
    // Manager = new CManager(gameConfig);
  });

  //change state game on
  socket.on('resStartGame', function(userDatas, skillDatas, projectileDatas, objDatas, chestDatas){
    Manager.setUsers(userDatas, skillDatas);
    Manager.setUsersSkills(skillDatas);
    // Manager.setProjectiles(projectileDatas);
    Manager.setObjs(objDatas);
    Manager.setChests(chestDatas);

    Manager.synchronizeUser(gameConfig.userID);
    Manager.start();
    console.log(Manager.users);

    canvasAddEvent();
    documentAddEvent();

    changeState(gameConfig.GAME_STATE_GAME_ON);
    userDataUpdateInterval = setInterval(updateUserDataHandler, 1000/30);
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
    var skillData = util.findData(skillTable, 'index', userData.skillIndex);

    skillData.targetPosition = userData.skillTargetPosition;
    skillData.direction = userData.skillDirection;
    if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK){
      skillData.projectileID = userData.skillProjectileID;
    }
    Manager.useSkill(userData.objectID, skillData);
  });
  socket.on('explodeProjectile', function(projectileID){
    Manager.explodeProjectile(projectileID);
  })
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
  socket.on('updateUser', function(userData){
    console.log('in updateUser')
    console.log(userData);
  });
  socket.on('updateSkillPossessions', function(possessSkills){
    Manager.updateSkillPossessions(gameConfig.userID, possessSkills);
  })
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
  ctx.fillStyle ="#000000";

  for(var i=0; i<Manager.obstacles.length; i++){
    ctx.beginPath();
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
  for(var i=0; i<Manager.objExps.length; i++){
    ctx.beginPath();
    var pos = util.worldToLocalPosition(Manager.objExps[i].position, gameConfig.userOffset);
    ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objExps[i].radius * 2 * gameConfig.scaleFactor, Manager.objExps[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
  ctx.fillStyle = "#ff0000";
  for(var i=0; i<Manager.objSkills.length; i++){
    ctx.beginPath();
    var pos = util.worldToLocalPosition(Manager.objSkills[i].position, gameConfig.userOffset);
    ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor, Manager.objSkills[i].radius * 2 * gameConfig.scaleFactor);
    ctx.closePath();
  }
}
function drawUsers(){
  for(var index in Manager.users){
    var radian = Manager.users[index].direction * radianFactor;

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    var center = util.worldToLocalPosition(Manager.users[index].center, gameConfig.userOffset);
    ctx.translate(center.x * gameConfig.scaleFactor, center.y * gameConfig.scaleFactor);
    // console.log('user positionX : ' + (Manager.users[index].position.x  * gameConfig.scaleFactor));
    // if(Manager.users[index].objectID === gameConfig.userID){
    //   ctx.translate(Manager.users[index].center.x * gameConfig.scaleFactor, Manager.users[index].center.y * gameConfig.scaleFactor);
    //   // ctx.translate(Manager.users[index].center.x, Manager.users[index].center.y);
    // }else{
    //   ctx.translate((Manager.users[index].center.x) * gameConfig.scaleFactor, (Manager.users[index].center.y) * gameConfig.scaleFactor);
    // }
    ctx.rotate(radian);
    ctx.fillStyle = 'yellow';
    ctx.arc(0, 0, 64 * gameConfig.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
    // ctx.drawImage(userImage, 0, 0, 128, 128,-Manager.users[index].size.width/2 * gameConfig.scaleFactor, -Manager.users[index].size.height/2 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    // ctx.drawImage(userHand, 0, 0, 128, 128,-Manager.users[index].size.width/2 * gameConfig.scaleFactor, -Manager.users[index].size.height/2 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);

    //draw cast effect
    if(Manager.users[index].skillCastEffectPlay){
      ctx.fillStyle ="#00ff00";
      ctx.beginPath();
      ctx.arc(-Manager.users[index].size.width/2 * gameConfig.scaleFactor, -Manager.users[index].size.height/2 * gameConfig.scaleFactor, 100, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }
    ctx.restore();
  }
};
function drawEffect(){
  for(var i=0; i<Manager.effects.length; i++){
    ctx.fillStyle ="#ff0000";
    var pos = util.worldToLocalPosition(Manager.effects[i].position, gameConfig.userOffset);
    // ctx.rotate(radian);
    ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor,
                 Manager.effects[i].radius * 2 * gameConfig.scaleFactor, Manager.effects[i].radius * 2 * gameConfig.scaleFactor);
    // ctx.drawImage(userHand, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    // ctx.drawImage(userImage, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
  }
};
function drawProjectile(){
  for(var i=0; i<Manager.projectiles.length; i++){
    ctx.fillStyle ="#ff0000";
    ctx.beginPath();
    var pos = util.worldToLocalPosition(Manager.projectiles[i].position, gameConfig.userOffset);
    ctx.fillRect(pos.x * gameConfig.scaleFactor, pos.y * gameConfig.scaleFactor, Manager.projectiles[i].radius * 2 * gameConfig.scaleFactor, Manager.projectiles[i].radius * 2 * gameConfig.scaleFactor)
    ctx.closePath();
  }
};
function drawBackground(){
  ctx.fillStyle = "#11ff11";
  var posX = -gameConfig.userOffset.x;
  var posY = -gameConfig.userOffset.y;
  var sizeW = gameConfig.CANVAS_MAX_SIZE.width * gameConfig.scaleFactor - posX;
  var sizeH = gameConfig.CANVAS_MAX_SIZE.height * gameConfig.scaleFactor- posY;
  ctx.fillRect(posX, posY, sizeW, sizeH);
};
function drawGrid(){
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#0000ff';
  ctx.globalAlpha = 0.15;
  ctx.beginPath();

  for(var x = - Manager.user.position.x; x<gameConfig.canvasSize.width; x+= gameConfig.CANVAS_MAX_LOCAL_SIZE.width/32){
    ctx.moveTo(x * gameConfig.scaleFactor, 0);
    ctx.lineTo(x * gameConfig.scaleFactor, gameConfig.CANVAS_MAX_LOCAL_SIZE.height * gameConfig.scaleFactor);
  }

  for(var y = - Manager.user.position.y; y<gameConfig.canvasSize.height; y+= gameConfig.CANVAS_MAX_LOCAL_SIZE.height/20){
    ctx.moveTo(0, y * gameConfig.scaleFactor);
    ctx.lineTo(gameConfig.CANVAS_MAX_LOCAL_SIZE.width * gameConfig.scaleFactor, y * gameConfig.scaleFactor);
  }

  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.closePath();
};
function updateUserDataHandler(){
  var userData = Manager.processUserData();
  userData.time = Date.now();
  userData.latency = latency;
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
  var targetPosition ={
    x : e.clientX/gameConfig.scaleFactor,
    y : e.clientY/gameConfig.scaleFactor
  }
  var worldTargetPosition = util.localToWorldPosition(targetPosition, gameConfig.userOffset);
  Manager.moveUser(worldTargetPosition);

  var userData = Manager.processUserData();
  userData.targetPosition = worldTargetPosition;
  userData.time = Date.now();
  userData.latency = latency;
  socket.emit('userMoveStart', userData);
};

var documentEventHandler = function(e){
  var keyCode = e.keyCode;
  var tempPos = {x : 0, y : 0};

  var skillIndex = 0;
  if(keyCode === 69 || keyCode === 32){
    skillIndex = 11;
    var skillData = util.findData(skillTable, 'index', 11);
  }else if(keyCode === 49){
    skillIndex = 21;
    skillData = util.findData(skillTable, 'index', 21);
  }else if(keyCode === 50){
    skillIndex = 31;
    skillData = util.findData(skillTable, 'index', 31);
  }else if(keyCode === 51){
    skillIndex = 41;
    skillData = util.findData(skillTable, 'index', 41);
  }else if(keyCode === 52){

  }
  //skills direction and targetPosition setting
  if(skillIndex){
    skillData.targetPosition = util.calcSkillTargetPosition(skillData, tempPos, Manager.users[gameConfig.userID]);
    skillData.direction = util.calcSkillTargetDirection(skillData.type, skillData.targetPosition, Manager.users[gameConfig.userID]);
    if(skillData.type === gameConfig.SKILL_TYPE_PROJECTILE || skillData.type === gameConfig.SKILL_TYPE_PROJECTILE_TICK){
      skillData.projectileID = util.generateRandomUniqueID(Manager.projectiles, gameConfig.PREFIX_SKILL_PROJECTILE);
    }
    Manager.useSkill(gameConfig.userID, skillData);
  }

  var userData = Manager.processUserData();
  userData.skillIndex = skillIndex;
  userData.skillDirection = skillData.direction;
  userData.skillTargetPosition = tempPos;

  socket.emit('userUseSkill', userData);
};
function canvasDisableEvent(){
  canvas.removeEventListener("click", canvasEventHandler);
};
function documentDisableEvent(){
  document.removeEventListener("keydown", documentEventHandler);
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
    x : Manager.user.position.x - gameConfig.canvasSize.width/(2 * gameConfig.scaleFactor) + Manager.user.size.width/2,
    y : Manager.user.position.y - gameConfig.canvasSize.height/(2 * gameConfig.scaleFactor)+ Manager.user.size.height/2
  }
};
