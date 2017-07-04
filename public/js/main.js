var socket = io();
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var util = require('../../modules/public/util.js');
var User = require('../../modules/client/CUser.js');
var CManager = require('../../modules/client/CManager.js');

var gameConfig = require('../../modules/public/gameConfig.json');

var Manager;

var radianFactor = Math.PI/180;

var resource = require('../../modules/client/resource.json');

var userImage = new Image();
var userHand = new Image();
var grid = new Image();
userImage.src = resource.USER_BODY_SRC;
userHand.src = resource.USER_HAND_SRC;
grid.src = resource.GRID_SRC;

//event config
document.getElementById('startButton').onclick = function(){
  setupSocket();

  reqSetCanvasSize();
  reqStartGame();
};

window.onresize = function(e){
  reqSetCanvasSize();
};

//request to server
function reqStartGame(){
  socket.emit('reqStartGame');
};

function reqSetCanvasSize(){
  var windowSize = {
    width : window.innerWidth,
    height : window.innerHeight
  };
  socket.emit('reqSetCanvasSize', windowSize);
};

function canvasSetting(){
  canvas.addEventListener('click', function(e){
    var targetPosition ={
      x : e.clientX,
      y : e.clientY
    }
    socket.emit('reqMove', targetPosition, gameConfig.userOffset);
  }, false);
  drawScreen();
  // userImage.addEventListener('load', userImageLoaded, false);
};

//draw
var drawInterval = false;
function drawScreen(){
  drawInterval = setInterval(function(){
    //draw background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawUser();
  }, 1000/60);
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
  for(var i=0; i<gameConfig.canvasMaxSize.width; i += resource.GRID_SIZE){
    var x = util.worldXCoordToLocalX(i, gameConfig.canvasSize.width);
    if(util.isDrawX(x, gameConfig)){
      for(var j=0; j<gameConfig.canvasMaxSize.height; j += resource.GRID_SIZE){
        var y = util.worldYCoordToLocalY(j, gameConfig.canvasSize.height);
        if(util.isDrawY(y, gameConfig)){
          ctx.drawImage(grid, x, y, resource.GRID_SIZE * gameConfig.scaleFactor, resource.GRID_SIZE * gameConfig.scaleFactor);
        }
      }
    }
  }
};

// server response
function setupSocket(){
  socket.on('setGlobalSetting', function(data){
    gameConfig.canvasMaxSize = data;
    console.log(gameConfig);
  });

  socket.on('setCorrespondUser', function(user){
    gameConfig.userID = user.objectID;
    gameConfig.userOffset = util.calculateOffset(user, gameConfig.canvasSize);
    Manager = new CManager(gameConfig);
  });

  socket.on('resStartGame', function(data){
    Manager.setUsers(data);
    Manager.synchronizeUser(gameConfig.userID);
    console.log(Manager.users);

    document.getElementById('infoScene').classList.remove('enable');
    document.getElementById('gameScene').classList.remove('disable');

    document.getElementById('infoScene').classList.add('disable');
    document.getElementById('gameScene').classList.add('enable');

    canvasSetting();
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

  socket.on('resSetCanvasSize', function(canvasSize, scaleFactor){
    var beforeOffset = gameConfig.userOffset;
    gameConfig.scaleFactor = scaleFactor;
    gameConfig.canvasSize = canvasSize;
    gameConfig.userOffset = util.calculateOffset(Manager.findUserAsWorldPosition(gameConfig.userID, beforeOffset), gameConfig.canvasSize);
    Manager.reCalcLocalPosition(beforeOffset, gameConfig.userOffset);
    //may need cancel drawInterval for a while

    //css height, width change

    setCanvasSize(scaleFactor);
  });
};

// local utils
function setCanvasSize(scaleFactor){
  // canvas.style.width = (canvas.width * scaleFactor) + 'px';
  // canvas.style.height = (canvas.height * scaleFactor) + 'px';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};
