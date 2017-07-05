// inner Modules
var util = require('../../modules/public/util.js');
var User = require('../../modules/client/CUser.js');
var CManager = require('../../modules/client/CManager.js');
var gameConfig = require('../../modules/public/gameConfig.json');

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
var resource;

var userImage, userHand;
var grid;

// game state var
var gameState = gameConfig.GAME_STATE_START_SCENE;
var gameUpdateFunc = start;

var drawInterval = null;

//state changer
function changeState(newState){
  switch (newState) {
    case gameConfig.GAME_STATE_LOAD:
      gameState = gameConfig.GAME_STATE_LOAD;
      gameUpdateFunc = load;
      break;
    case gameConfig.GAME_STATE_START_SCENE:
      gameState = gameConfig.GAME_STATE_START_SCENE;
      gameUpdateFunc = standby;
      break;
    case gameConfig.GAME_STATE_GAME_START:
      gameState = gameConfig.GAME_STATE_GAME_START;
      gameUpdateFunc = start;
      break;
    case gameConfig.GAME_STATE_GAME_ON:
      gameState = gameConfig.GAME_STATE_GAME_ON;
      gameUpdateFunc = game;
      break;
    case gameConfig.GAME_STATE_END:
      gameSate = gameConfig.GAME_STATE_END;
      gameUpdateFunc = end;
      break;
  }
};

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
  socket = io();

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  infoScene = document.getElementById('infoScene');
  gameScene = document.getElementById('gameScene');
  standingScene = document.getElementById('standingScene');

  // inner Modules
  util = require('../../modules/public/util.js');
  User = require('../../modules/client/CUser.js');
  CManager = require('../../modules/client/CManager.js');
  gameConfig = require('../../modules/public/gameConfig.json');

  Manager = new CManager(gameConfig);

  // resource 관련
  resource = require('../../modules/client/resource.json');

  userImage = new Image();
  userHand = new Image();
  grid = new Image();
  userImage.src = resource.USER_BODY_SRC;
  userHand.src = resource.USER_HAND_SRC;
  grid.src = resource.GRID_SRC;
};

function setCanvasSize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  gameConfig.scaleFactor = 1;
  gameConfig.canvasSize = {width : window.innerWidth, height : window.innerHeight};
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
  drawUser();
  drawGrid();
};
// socket connect and server response configs
function setupSocket(){

  //change state game on
  socket.on('resStartGame', function(datas){
    Manager.setUsers(datas);
    console.log(Manager.users);

    canvasAddEvent();

    changeState(gameConfig.GAME_STATE_GAME_ON);
  });
  socket.on('setSyncUser', function(user){
    gameConfig.userID = user.objectID;
    gameConfig.userOffset = util.calculateOffset(user, gameConfig.canvasSize);
    Manager.synchronizeUser(gameConfig.userID);
    // Manager = new CManager(gameConfig);
  });

  socket.on('userJoined', function(data){
    Manager.setUser(data);

    console.log(Manager.users);
  });

  socket.on('resMove', function(userData){
    if(userData.objectID === gameConfig.userID){
      gameConfig.userOffset = util.calculateOffset(userData, gameConfig.canvasSize);
    }
    console.log(userData);
    console.log('move start');
    Manager.moveUser(userData);
  });
  //
  // socket.on('resSetCanvasSize', function(canvasSize, scaleFactor){
  //   // var beforeOffset = gameConfig.userOffset;
  //   gameConfig.scaleFactor = scaleFactor;
  //   gameConfig.canvasSize = canvasSize;
  //   // gameConfig.userOffset = util.calculateOffset(, gameConfig.canvasSize);
  //   // Manager.reCalcLocalPosition(beforeOffset, gameConfig.userOffset);
  //   //may need cancel drawInterval for a while
  //
  //   //css height, width change
  //
  //   setCanvasSize(scaleFactor);
  // });
};

//draw
function drawScreen(){
  //draw background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

function drawUser(){
  for(var index in Manager.users){
    var radian = Manager.users[index].direction * radianFactor;

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.translate(Manager.users[index].center.x, Manager.users[index].center.y);
    ctx.rotate(radian);
    ctx.drawImage(userHand, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);
    ctx.drawImage(userImage, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128 * gameConfig.scaleFactor, 128 * gameConfig.scaleFactor);

    ctx.restore();
  }
};

function drawGrid(){
  //draw boundary

  //draw grid
  for(var i=0; i<gameConfig.CANVAS_MAX_SIZE.width; i += resource.GRID_SIZE){
    if(util.isDrawX(i, gameConfig)){
      var x = util.worldXCoordToLocalX(i, gameConfig.userOffset.x);
      for(var j=0; j<gameConfig.CANVAS_MAX_SIZE.height; j += resource.GRID_SIZE){
        if(util.isDrawY(j, gameConfig)){
          var y = util.worldYCoordToLocalY(j, gameConfig.userOffset.y);
          ctx.drawImage(grid, x, y);
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

if(drawInterval === null){
  drawInterval = setInterval(gameUpdateFunc,fps);
}
// local utils
// function setCanvasSize(scaleFactor){
//   // canvas.style.width = (canvas.width * scaleFactor) + 'px';
//   // canvas.style.height = (canvas.height * scaleFactor) + 'px';
//   canvas.width = window.innerWidth;
//   canvas.height = window.innerHeight;
//
// };
// function getWindowSize(){
//   var returnVal = {
//     width : window.innerWidth,
//     height : window.innerHeight
//   }
//   return returnVal;
// };
// function setCanvasSizeAndScale(windowSize, canvasMaxSize){
//   if(windowSize.width >= canvasMaxLocalSize.width || windowSize.height >= canvasMaxLocalSize.height){
//     var scaleFactor = (windowSize.width / canvasMaxLocalSize.width) > (windowSize.height / canvasMaxLocalSize.height) ?
//                   (windowSize.width / canvasMaxLocalSize.width) : (windowSize.height / canvasMaxLocalSize.height);
//     // localConfig.canvasSize = {
//     //   width : config.canvasMaxLocalSize.width,
//     //   height : config.canvasMaxLocalSize.height
//     // };
//   }
//   gameConfig.scaleFactor = scaleFactor;
//   gameConfig.canvasSize = windowSize;
//   return 1;
// }
