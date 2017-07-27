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

var drawInterval = null;

//state changer
function changeState(newState){
  clearInterval(drawInterval);
  drawInterval = null;
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

  // resource 관련
  resources = require('../../modules/public/resource.json');

  userImage = new Image();
  userHand = new Image();
  grid = new Image();
  userImage.src = resources.USER_BODY_SRC;
  userHand.src = resources.USER_HAND_SRC;
  grid.src = resources.GRID_SRC;
};

function setCanvasSize(){

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if(gameConfig.userOffset){
    var oldOffsetX = gameConfig.userOffset.x;
    var oldOffsetY = gameConfig.userOffset.y;
  }

  gameConfig.canvasSize = {width : window.innerWidth, height : window.innerHeight};
  gameConfig.scaleFactor = setCanvasScale(gameConfig.canvasSize, gameConfig.CANVAS_MAX_LOCAL_SIZE);

  if(gameConfig.userOffset){
    var worldPosUser = {
      position : util.localToWorldPosition(Manager.user.position,gameConfig.userOffset),
      size : Manager.user.size
    };
    gameConfig.userOffset = util.calculateOffset(worldPosUser, gameConfig.canvasSize);

    var revisionX = oldOffsetX - gameConfig.userOffset.x;
    var revisionY = oldOffsetY - gameConfig.userOffset.y;

    Manager.revisionAllObj(revisionX, revisionY);
  }
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

  drawScreen();
  drawGrid();
  drawObstacles();
  drawObjs();
  drawUsers();
  drawEffect();
  drawProjectile();
};
// socket connect and server response configs
function setupSocket(){
  socket = io();

  socket.on('setSyncUser', function(user){
    gameConfig.userID = user.objectID;
    gameConfig.userOffset = util.calculateOffset(user, gameConfig.canvasSize);
    // Manager = new CManager(gameConfig);
  });

  //change state game on
  socket.on('resStartGame', function(userDatas, skillDatas, projectileDatas, objDatas){
    Manager.setUsers(userDatas, skillDatas);
    Manager.setUsersSkills(skillDatas);
    Manager.setProjectiles(projectileDatas);
    Manager.setObjs(objDatas);

    Manager.synchronizeUser(gameConfig.userID);
    Manager.start();
    console.log(Manager.users);

    canvasAddEvent();
    documentAddEvent();

    changeState(gameConfig.GAME_STATE_GAME_ON);
  });

  socket.on('userJoined', function(data){
    Manager.setUser(data);
    console.log('user joined ' + data.objectID);
  });

  socket.on('resMove', function(userData){
    if(userData.objectID === gameConfig.userID){
      revisionUserPos(userData);
    }
    console.log(userData.objectID + ' move start');
    Manager.updateUserData(userData);
    Manager.moveUser(userData);
  });
  socket.on('resSkill', function(userData, resSkillData){
    if(userData.objectID === gameConfig.userID){
      revisionUserPos(userData);
    }
    var skillData = util.findData(skillTable, 'index', resSkillData.index);

    skillData.targetPosition = util.worldToLocalPosition(resSkillData.targetPosition, gameConfig.userOffset);
    skillData.direction = resSkillData.direction;
    skillData.totalTime = resSkillData.totalTime;
    skillData.fireTime = resSkillData.fireTime;

    Manager.updateUserData(userData);
    Manager.useSkill(userData.objectID, skillData);

    //create user castingEffect
    // Manager.createSkillEffect(skillData.targetPosition, skillData.radius, userData.direction, skillData.fireTime);

    // var animator = animateCastingEffect(userData, skillData.totalTime, ctx);
    // setInterval(animator.startAnimation, fps * 2);
    // user state change
    // animation start
  });
  socket.on('setProjectile', function(projectileData){
    console.log(projectileData);
    if(projectileData.explode){
      var skillData = util.findData(skillTable, 'index', projectileData.index);
      Manager.explodeProjectile(projectileData, skillData.effectLastTime);
    }else{
      Manager.makeProjectile(projectileData);
    }
  });
  socket.on('deleteOBJ', function(objID){
    console.log(objID + ' collide');
  });
  socket.on('updateUser', function(userData){
    console.log('in updateUser')
    console.log(userData);
  });
  socket.on('userLeave', function(objID){
    Manager.kickUser(objID);
  });
};

function revisionUserPos(userData){
  var oldOffsetX = gameConfig.userOffset.x;
  var oldOffsetY = gameConfig.userOffset.y;

  gameConfig.userOffset = util.calculateOffset(userData, gameConfig.canvasSize);
  var revisionX = oldOffsetX - gameConfig.userOffset.x;
  var revisionY = oldOffsetY - gameConfig.userOffset.y;
  // Manager.revisionAllObj(revisionX, revisionY);
  Manager.revisionUserPos(revisionX, revisionY);
};
//draw
function drawScreen(){
  //draw background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
function drawObstacles(){
  ctx.fillStyle ="#000000";

  for(var index in Manager.obstacles){
    ctx.beginPath();
    ctx.arc((Manager.obstacles[index].localPosition.x + resources.OBJ_TREE_SIZE/2) * gameConfig.scaleFactor, (Manager.obstacles[index].localPosition.y + resources.OBJ_TREE_SIZE/2) * gameConfig.scaleFactor,
            resources.OBJ_TREE_SIZE/2, 0, 2*Math.PI);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
    ctx.closePath();
    // ctx.fillRect(Manager.obstacles[index].staticEle.x, Manager.obstacles[index].staticEle.y, resources.OBJ_TREE_SIZE, resources.OBJ_TREE_SIZE);
  }
};
function drawObjs(){
  ctx.fillStyle = "#0000ff";
  for(var i=0; i<Manager.objExps.length; i++){
    ctx.beginPath();
    ctx.fillRect(Manager.objExps[i].position.x, Manager.objExps[i].position.y, Manager.objExps[i].radius * 2, Manager.objExps[i].radius * 2);
    ctx.closePath();
  }
}
function drawUsers(){
  for(var index in Manager.users){
    var radian = Manager.users[index].direction * radianFactor;

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(Manager.users[index].center.x, Manager.users[index].center.y);
    ctx.rotate(radian);
    ctx.drawImage(userImage, 0, 0, 128, 128,-Manager.users[index].size.width/2 * gameConfig.scaleFactor, -Manager.users[index].size.height/2 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    ctx.drawImage(userImage, 0, 0, 128, 128,-Manager.users[index].size.width/2 * gameConfig.scaleFactor, -Manager.users[index].size.height/2 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);

    //draw cast effect
    if(Manager.users[index].skillEffectPlay){
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
  for(var index in Manager.effects){
    var radian = Manager.effects[index].direction * radianFactor;

    ctx.fillStyle ="#ff0000";
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    var centerX = Manager.effects[index].targetPosition.x + Manager.effects[index].explosionRadius;
    var centerY = Manager.effects[index].targetPosition.y + Manager.effects[index].explosionRadius;
    ctx.translate(centerX, centerY);
    // ctx.rotate(radian);
    ctx.fillRect(-Manager.effects[index].explosionRadius * gameConfig.scaleFactor, -Manager.effects[index].explosionRadius * gameConfig.scaleFactor,
                 Manager.effects[index].explosionRadius * 2 * gameConfig.scaleFactor, Manager.effects[index].explosionRadius * 2 * gameConfig.scaleFactor);
    // ctx.drawImage(userHand, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    // ctx.drawImage(userImage, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    ctx.restore();
  }
};
function drawProjectile(){
  for(var index in Manager.projectiles){
    ctx.fillStyle ="#ff0000";
    ctx.beginPath();
    ctx.arc((Manager.projectiles[index].position.x - Manager.projectiles[index].radius) * gameConfig.scaleFactor,
            (Manager.projectiles[index].position.y - Manager.projectiles[index].radius) * gameConfig.scaleFactor, 50, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }
};
function drawGrid(){
  //draw boundary

  //draw grid
  for(var i=0; i<gameConfig.CANVAS_MAX_SIZE.width * gameConfig.scaleFactor; i += resources.GRID_SIZE * gameConfig.scaleFactor){
    if(util.isDrawX(i * gameConfig.scaleFactor, gameConfig)){
      var x = util.worldXCoordToLocalX(i * gameConfig.scaleFactor, gameConfig.userOffset.x);
      for(var j=0; j<gameConfig.CANVAS_MAX_SIZE.height * gameConfig.scaleFactor; j += resources.GRID_SIZE * gameConfig.scaleFactor){
        if(util.isDrawY(j * gameConfig.scaleFactor, gameConfig)){
          var y = util.worldYCoordToLocalY(j * gameConfig.scaleFactor, gameConfig.userOffset.y);
          ctx.drawImage(grid, 0, 0, 48, 48, x, y, resources.GRID_IMG_SIZE * gameConfig.scaleFactor, resources.GRID_IMG_SIZE * gameConfig.scaleFactor);
        }
      }
    }
  }
};

function canvasAddEvent(){
  canvas.addEventListener('click', function(e){
    var targetPosition ={
      x : e.clientX,
      y : e.clientY
    }
    var worldTargetPosition = util.localToWorldPosition(targetPosition, gameConfig.userOffset);
    socket.emit('reqMove', worldTargetPosition);
  }, false);
}
function documentAddEvent(){
  document.addEventListener('keydown', function(e){
    var keyCode = e.keyCode;
    var tempPos = util.localToWorldPosition({x : 0, y : 0}, gameConfig.userOffset);
    if(keyCode === 69 || keyCode === 32){
      socket.emit('reqSkill', 11);
    }else if(keyCode === 49){
      socket.emit('reqSkill', 21, tempPos);
    }else if(keyCode === 50){
      socket.emit('reqSkill', 41, tempPos);
    }else if(keyCode === 51){
      socket.emit('reqSkill', 51);
    }
  }, false);
}
update();

function setCanvasScale(windowSize, canvasMaxLocalSize){
  var scaleFactor = 1;
  if(windowSize.width >= canvasMaxLocalSize.width || windowSize.height >= canvasMaxLocalSize.height){
    var scaleFactor = (windowSize.width / canvasMaxLocalSize.width) > (windowSize.height / canvasMaxLocalSize.height) ?
                  (windowSize.width / canvasMaxLocalSize.width) : (windowSize.height / canvasMaxLocalSize.height);
  }
  return scaleFactor;
}
