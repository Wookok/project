var socket = io();
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var util = require('./utils/util.js');
var User = require('./utils/CUser.js');
var CManager = require('./utils/CManager.js');

var gameConfig = require('./utils/gameConfig.json');
<<<<<<< HEAD
=======

var userID;
var userOffset = {};
var Manager;

var userImage = new Image();
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b

var Manager;

<<<<<<< HEAD
var userImage = new Image();
var userHand = new Image();
userImage.src = '../images/CharBase.svg';
userHand.src = '../images/CharHand.svg';

//event config
document.getElementById('startButton').onclick = function(){
  setupSocket();

=======
setupSocket();

//event config
document.getElementById('startButton').onclick = function(){
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
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
}

//draw
var drawInterval = false;
function drawScreen(){
  drawInterval = setInterval(function(){
    ctx.fillStyle = "#aaaaaa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for(var index in Manager.users){
      var degree = Manager.users[index].direction;
      var radian = degree * Math.PI/180;

      var centerX = Manager.users[index].position.x + Manager.users[index].size.width/2;
      var centerY = Manager.users[index].position.y + Manager.users[index].size.height/2;

      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      ctx.translate(centerX, centerY);
      ctx.rotate(radian);
      ctx.drawImage(userHand, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128, 128);
      ctx.drawImage(userImage, 0, 0, 128, 128,-Manager.users[index].size.width/2, -Manager.users[index].size.height/2, 128, 128);

      ctx.restore();
    }
  }, 1000/60);
};

// server response
function setupSocket(){

  socket.on('setCorrespondUser', function(user){
<<<<<<< HEAD
    gameConfig.userID = user.objectID;
    gameConfig.userOffset = util.calculateOffset(user.position, gameConfig.canvasSize);
    Manager = new CManager(gameConfig);
  });

  socket.on('resStartGame', function(data){
    Manager.setUsers(data);
    Manager.synchronizeUser(gameConfig.userID);
=======
    userID = user.objectID;
    userOffset = util.calculateOffset(user.position, gameConfig.canvasSize);
    Manager = new CManager(userOffset);
  });

  socket.on('resStartGame', function(data){
    Manager.setUsers(data, userOffset);
    Manager.synchronizeUser(userID);
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
    console.log(Manager.users);

    document.getElementById('infoScene').classList.remove('enable');
    document.getElementById('gameScene').classList.remove('disable');

    document.getElementById('infoScene').classList.add('disable');
    document.getElementById('gameScene').classList.add('enable');

    canvasSetting();
  });

  socket.on('userJoined', function(data){
<<<<<<< HEAD
    Manager.setUser(data);
=======
    Manager.setUser(data, userOffset);
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b

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
<<<<<<< HEAD
  // canvas.style.width = (canvas.width * scaleFactor) + 'px';
  // canvas.style.height = (canvas.height * scaleFactor) + 'px';
=======
  canvas.style.width = (canvas.width * scaleFactor) + 'px';
  canvas.style.height = (canvas.height * scaleFactor) + 'px';
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
  canvas.width = gameConfig.canvasSize.width;
  canvas.height = gameConfig.canvasSize.height;
};
