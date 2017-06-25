(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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

},{"./utils/CUser.js":2,"./utils/util.js":3}],2:[function(require,module,exports){
var util = require('./util.js');

var User = function(userData){
  this.objectID = userData.objectID;
  this.position = userData.position;
  this.targetPosition = userData.targetPosition;
  this.speed = userData.speed;
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;
  this.targetDirection = userData.targetDirection;

  this.moveInterval = false;
  this.rotateInterval = false;
};

User.prototype = {
  rotate : function(){
    if(this.rotateInterval){
      clearInterval(this.rotateInterval);
      this.rotateInterval = false;
    }
    this.rotateInterval = setInterval(util.rotate.bind(this), 1000);
  },
  move : function(){
    if(this.moveInterval){
      clearInterval(this.moveInterval);
      this.moveInterval = false;
    }
    console.log('move' + this.speed.x + ' : ' + this.speed.y);
    this.moveInterval = setInterval(util.move.bind(this), 1000);
  },
  stop : function(){
    if(this.moveInterval){
      clearInterval(this.moveInterval);
      this.moveInterval = false;
    }
    if(this.rotateInterval){
      clearInterval(this.rotateInterval);
      this.rotateInterval = false;
    }
  }
};

module.exports = User;

},{"./util.js":3}],3:[function(require,module,exports){

//must use with bind method
exports.rotate = function(){
  if(this.targetDirection == this.direction){
    this.stop();
    this.move();
  }else if(this.targetDirection > this.direction){
    if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
      this.direction += Math.abs(this.targetDirection - this.direction);
    }else{
      this.direction += this.rotateSpeed;
    }
  }else if(this.targetDirection < this.direction){
    if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
      this.direction -= Math.abs(this.targetDirection - this.direction);
    }else{
      this.direction -= this.rotateSpeed;
    }
  }
};

//must use with bind method
exports.move = function(){
  //calculate dist with target
  var distX = this.targetPosition.x - this.position.x;
  var distY = this.targetPosition.y - this.position.y;

  if(distX == 0 && distY == 0){
    this.stop();
    console.log('stop');
  }
  if(Math.abs(distX) < Math.abs(this.speed.x)){
    this.speed.x = distX;
  }
  if(Math.abs(distY) < Math.abs(this.speed.y)){
    this.speed.y = distY;
  }
  this.position.x += this.speed.x;
  this.position.y += this.speed.y;
}

//must use with bind method
//setup when click canvas for move
exports.setSpeed = function(){
  var distX = this.targetPosition.x - this.position.x;
  var distY = this.targetPosition.y - this.position.y;

  if(distX == 0  && distY ==0){
    this.speed.x = 0;
    this.speed.y = 0;
  }else if(Math.pow(distX,2) + Math.pow(distY,2) < 100){
    this.speed.x = distX;
    this.speed.y = distY;
  }else{
    this.speed.x = (distX>=0?1:-1)*Math.sqrt(Math.pow(this.maxSpeed,2)*Math.pow(distX,2)/(Math.pow(distX,2)+Math.pow(distY,2)));
    this.speed.y = (distY>=0?1:-1)*Math.sqrt(Math.pow(this.maxSpeed,2)*Math.pow(distY,2)/(Math.pow(distX,2)+Math.pow(distY,2)));
  }
};

exports.assignRandomID = function(){
  var output = "";
  for(var i=0; i<6; i++){
    output += Math.floor(Math.random()*16).toString(16);
  }
  return output;
}

},{}]},{},[1]);
