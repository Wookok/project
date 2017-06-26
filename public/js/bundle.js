(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var socket = io();
var userName;
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var util = require('./utils/util.js');
var User = require('./utils/CUser.js');
var CManager = require('./utils/CManager.js');
var Manager = new CManager();

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
  socket.emit('reqSetWindowSize', windowSize);
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

var drawInterval = false;
function drawScreen(){
  drawInterval = setInterval(function(){
    ctx.fillStyle = "#aaaaaa";
    ctx.fillRect(0, 0, 1000, 1000);

    for(var index in Manager.users){
      if(Manager.users[index].direction < 0){
        var degree = Manager.users[index].direction + 360;
      }else{
        degree = Manager.users[index].direction;
      }
      var sourceX = Math.floor((degree % 90) / 10) * 75;
      var sourceY = Math.floor((degree / 90)) * 75;

      ctx.drawImage(userImage, sourceX, sourceY, 69, 69,
      Manager.users[index].position.x, Manager.users[index].position.y, 64, 64);
    }
  }, 1000/30);
};

function setupSocket(){

  socket.on('resStartGame', function(data){

    Manager.setUsers(data);
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

  socket.on('resMove', function(data){
    console.log(data);
    console.log('move start');
    Manager.moveUser(data);
  });

  socket.on('resSetWindowSize', function(data){
    localConfig.windowSize = data;

    setCanvasSize();
  });
};

function setCanvasSize(){
  canvas.width = localConfig.windowSize.width;
  canvas.height = localConfig.windowSize.height;
};

},{"./utils/CManager.js":2,"./utils/CUser.js":3,"./utils/util.js":4}],2:[function(require,module,exports){
var User = require('./CUser.js');

var CManager = function(){
	this.users = [];
};

CManager.prototype = {
	setUser : function(userData){
		if(!this.checkUserAtUsers(userData)){
			var tempUser = new User(userData);
			this.users[userData.objectID] = tempUser;
		}else{
			console.log('user.objectID duplicated. something is wrong.');
		}
	},
	setUsers : function(userDatas){
		for(var index in userDatas){
			var tempUser = new User(userDatas[index]);
			this.users[userDatas[index].objectID] = tempUser;
		}
	},
	checkUserAtUsers : function(userData){
		if(userData.objectID in this.users){
			return true;
		}else{
			return false;
		}
	},
	moveUser : function(userData){
		if(this.checkUserAtUsers(userData)){
			this.users[userData.objectID].position = userData.position;
	    this.users[userData.objectID].targetPosition = userData.targetPosition;
	    this.users[userData.objectID].speed = userData.speed;
	    this.users[userData.objectID].direction = userData.direction;
	    this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
	    this.users[userData.objectID].targetDirection = userData.targetDirection;

	    this.users[userData.objectID].stop();
	    this.users[userData.objectID].rotate();
		}else{
  		console.log('can`t find user data');
		}
	},
};

module.exports = CManager;

},{"./CUser.js":3}],3:[function(require,module,exports){
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

},{"./util.js":4}],4:[function(require,module,exports){

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

},{}]},{},[1]);
