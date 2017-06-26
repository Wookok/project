
var socket = io();
var userName;
var canvas;
var ctx;

var util = require('./utils/util.js');
var User = require('./utils/CUser.js');
var CManager = require('./utils/CManager.js');
var Manager = new CManager();

var users = [];
var userImage = new Image();
userImage.src = '../images/Character.png';

var localConfig = {};

setupSocket();

document.getElementById('startButton').onclick = function(){
  reqSetWindowSize();
  reqStartGame();
};

window.onresize = function(e){
  reqSetWindowSize();
};

function reqStartGame(){
  socket.emit('reqStartGame');
};

function reqSetWindowSize(){
  var windowSize = {
    width : window.innerWidth,
    height : window.innerHeight
  };
  socket.emit('reqSetWindowSize');
};

function canvasSetting(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  setCanvasSize();

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

var drawInterval = false;
function drawScreen(){
  drawInterval = setInterval(function(){
    ctx.fillStyle = "#aaaaaa";
    ctx.fillRect(0, 0, 1000, 1000);

    for(var index in users){
      if(users[index].direction < 0){
        var degree = users[index].direction + 360;
      }else{
        degree = user[index].direction;
      }
      // console.log('degree : ' + degree);
      // console.log('degree % 10 : ' + degree);
      // console.log('direction : ' +  users[index].direction);
      var sourceX = Math.floor((degree / 10)) * 75;
      var sourceY = Math.floor((degree / 90)) * 75;
      console.log(sourceX + ' : ' + sourceY);
      // console.log(users[index].position.x + ' : ' + users[index].position.y + ' : '
      //  + users[index].size.width + ' : ' + users[index].size.height);
      ctx.drawImage(userImage, sourceX, sourceY, 69, 69,
      users[index].position.x, users[index].position.y, 64, 64);
    }
  }, 1000/30);
};

function setupSocket(){

  socket.on('resStartGame', function(data){
    // console.log(data);
    // users = data;
    Manager.setUsers(data);
    // setUsers(data);
    document.getElementById('infoScene').classList.remove('enable');
    document.getElementById('gameScene').classList.remove('disable');

    document.getElementById('infoScene').classList.add('disable');
    document.getElementById('gameScene').classList.add('enable');
    canvasSetting();
  });

  socket.on('userJoined', function(data){
    Manager.setUser(data);
    // setUser(data);
    console.log(users);
  });

  socket.on('resMove', function(data){
    console.log(data);
    console.log('move start');
    Manager.moveUser(data);
    // if(checkUserAtUsers(data)){
    //   users[data.objectID].position = data.position;
    //   users[data.objectID].targetPosition = data.targetPosition;
    //   users[data.objectID].speed = data.speed;
    //   users[data.objectID].direction = data.direction;
    //   users[data.objectID].rotateSpeed = data.rotateSpeed;
    //   users[data.objectID].targetDirection = data.targetDirection;
    //
    //   users[data.objectID].stop();
    //   users[data.objectID].rotate();
    // }else{
    //   console.log('can`t find user data');
    // }
  });

  socket.on('resSetWindowSize', function(data){
    localConfig.windowSize = windowSize;
  });
};

function setCanvasSize(){
  canvas.width = localConfig.windowSize.width;
  canvas.height = localConfig.windowSize.height;
};
//
// function setUsers(userDatas){
//   for(var index in userDatas){
//     console.log(index);
//     var tempUser = new User(userDatas[index]);
//     users[tempUser.objectID] = tempUser;
//   }
//   console.log(users);
// };
//
// function setUser(userData){
//   if(!checkUserAtUsers(userData)){
//     var tempUser = new User(userData);
//     users[userData.objectID] = tempUser;
//   }else{
//     console.log('user.objectID duplicated. something is wrong.');
//   }
// }
//
// function checkUserAtUsers(userData){
//   if(userData.objectID in users){
//     return true;
//   }else{
//     return false;
//   }
// };

// add before sevice
// window.onbeforeunload = function(e){
//   return 'Are you sure';
// }
