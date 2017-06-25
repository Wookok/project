
var socket = io();
var userName;
var canvas;
var ctx;

var util = require('./utils/util.js');
var User = require('./utils/CUser.js');

var users = [];
var userImage = new Image();
userImage.src = '../images/Character.png';

setupSocket();

document.getElementById('startButton').onclick = function(){
  reqStartGame();
};

function reqStartGame(){
  socket.emit('reqStartGame');
};

function canvasSetting(){
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  canvas.addEventListener('click', function(e){
    var targetPosition ={
      x : e.clientX,
      y : e.clientY
    }
    socket.emit('reqMove', targetPosition);
  }, false);
  // ctx.drawImage(userImage, 0, 0, 69, 69, 0, 0, 64, 64);
  drawScreen();
  // userImage.addEventListener('load', userImageLoaded, false);
}

var drawInterval = false;
function drawScreen(){
  drawInterval = setInterval(function(){
    ctx.fillStyle = "#aaaaaa";
    ctx.fillRect(0, 0, 1000, 1000);

    for(var index in users){
      // radian to degree
      if(users[index].direction < 0){
        var radian = users[index].direction + Math.PI*2
      }else{
        radian = users[index].direction;
      }
      var degree = radian * 180 / Math.PI;
      console.log('degree : ' + degree);
      console.log('degree % 10 : ' + degree);
      console.log('direction : ' +  users[index].direction);
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

    setUsers(data);
    document.getElementById('infoScene').classList.remove('enable');
    document.getElementById('gameScene').classList.remove('disable');

    document.getElementById('infoScene').classList.add('disable');
    document.getElementById('gameScene').classList.add('enable');
    canvasSetting();
  });

  socket.on('userJoined', function(data){
    setUser(data);
    console.log(users);
  });

  var temp = false;
  socket.on('resMove', function(data){
    console.log(data);
    console.log('move start');
    if(checkUserAtUsers(data)){
      users[data.objectID].position = data.position;
      users[data.objectID].targetPosition = data.targetPosition;
      users[data.objectID].speed = data.speed;
      users[data.objectID].direction = data.direction;
      users[data.objectID].rotateSpeed = data.rotateSpeed;
      users[data.objectID].targetDirection = data.targetDirection;

      users[data.objectID].stop();
      users[data.objectID].rotate();
    }else{
      console.log('can`t find user data');
    }
    //debug
    clearInterval(temp);
    temp = setInterval(function(){
      // console.log('targetDirection : ' + user.targetDirection);
      // console.log('rotateSpeed : ' + user.rotateSpeed);
      console.log(users[data.objectID].targetPosition.x + ' : ' +  users[data.objectID].targetPosition.y);
      console.log(users[data.objectID].direction + ' : ' + users[data.objectID].position.x + ' : ' + users[data.objectID].position.y);
    }, 1000);
  });
};

function setUsers(userDatas){
  for(var index in userDatas){
    console.log(index);
    var tempUser = new User(userDatas[index]);
    users[tempUser.objectID] = tempUser;
  }
  console.log(users);
};

function setUser(userData){
  if(!checkUserAtUsers(userData)){
    var tempUser = new User(userData);
    users[userData.objectID] = tempUser;
  }else{
    console.log('user.objectID duplicated. something is wrong.');
  }
}

function checkUserAtUsers(userData){
  if(userData.objectID in users){
    return true;
  }else{
    return false;
  }
};

// add before sevice
// window.onbeforeunload = function(e){
//   return 'Are you sure';
// }
