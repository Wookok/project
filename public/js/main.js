
var socket = io();
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var util = require('./utils/util.js');
var User = require('./utils/CUser.js');
var CManager = require('./utils/CManager.js');

var gameConfig = require('./utils/gameConfig.json');

var userID;
var userOffset = {};
var Manager;

var userImage = new Image();

userImage.src = '../images/Character.png';

setupSocket();

//event config
document.getElementById('startButton').onclick = function(){
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
    socket.emit('reqMove', targetPosition);
  }, false);
  drawScreen();
  // userImage.addEventListener('load', userImageLoaded, false);
}

//draw
var drawInterval = false;
function drawScreen(){
  // setInterval(function(){
  //   for(var index in Manager.users){
  //     console.log(Manager.users[index]);
  //   }
  // }, 1000);
  //
  // drawInterval = setInterval(function(){
  //   ctx.fillStyle = "#aaaaaa";
  //   ctx.fillRect(0, 0, 1000, 1000);
  //
  //   for(var index in Manager.users){
  //     if(Manager.users[index].direction < 0){
  //       var degree = Manager.users[index].direction + 360;
  //     }else{
  //       degree = Manager.users[index].direction;
  //     }
  //     var sourceX = Math.floor((degree % 90) / 10) * 75;
  //     var sourceY = Math.floor((degree / 90)) * 75;
  //
  //     ctx.drawImage(userImage, sourceX, sourceY, 69, 69,
  //     Manager.users[index].position.x, Manager.users[index].position.y, 64, 64);
  //   }
  // }, 1000/30);
};

// server response
function setupSocket(){

  socket.on('setCorrespondUser', function(user){
    userID = user.objectID;
    userOffset = util.calculateOffset(user.position, gameConfig.canvasSize);
    Manager = new CManager(userOffset);
  });

  socket.on('resStartGame', function(data){
    Manager.setUsers(data, userOffset);
    Manager.synchronizeUser(userID);
    console.log(Manager.users);

    document.getElementById('infoScene').classList.remove('enable');
    document.getElementById('gameScene').classList.remove('disable');

    document.getElementById('infoScene').classList.add('disable');
    document.getElementById('gameScene').classList.add('enable');

    canvasSetting();
  });

  socket.on('userJoined', function(data){
    Manager.setUser(data, userOffset);

    console.log(Manager.users);
  });

  socket.on('resMove', function(userData){
    console.log(userData);
    console.log('move start');
    Manager.moveUser(userData);
  });

  socket.on('resSetCanvasSize', function(canvasSize, scaleFactor){
    gameConfig.canvasSize = canvasSize;

    //css height, width change

    setCanvasSize(scaleFactor);
  });
};

// local utils
function setCanvasSize(scaleFactor){
  canvas.style.width = (canvas.width * scaleFactor) + 'px';
  canvas.style.height = (canvas.height * scaleFactor) + 'px';
  canvas.width = gameConfig.canvasSize.width;
  canvas.height = gameConfig.canvasSize.height;
};
