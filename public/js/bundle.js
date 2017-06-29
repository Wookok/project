(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var socket = io();
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var util = require('./utils/util.js');
var User = require('./utils/CUser.js');
var CManager = require('./utils/CManager.js');

var gameConfig = require('./utils/gameConfig.json');

var Manager;

var radianFactor = Math.PI/180;

var userImage = new Image();
var userHand = new Image();
userImage.src = '../images/CharBase.svg';
userHand.src = '../images/CharHand.svg';

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
}

//draw
var drawInterval = false;
function drawScreen(){
  drawInterval = setInterval(function(){
    ctx.fillStyle = "#aaaaaa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for(var index in Manager.users){
      console.log(Manager.users);
      var radian = Manager.users[index].direction * radianFactor;

      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      ctx.translate(Manager.users[index].center.x, Manager.users[index].center.y);
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
    gameConfig.userID = user.objectID;
    gameConfig.userOffset = util.calculateOffset(user.position, gameConfig.canvasSize);
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
  // canvas.style.width = (canvas.width * scaleFactor) + 'px';
  // canvas.style.height = (canvas.height * scaleFactor) + 'px';
  canvas.width = gameConfig.canvasSize.width;
  canvas.height = gameConfig.canvasSize.height;
};

},{"./utils/CManager.js":2,"./utils/CUser.js":3,"./utils/gameConfig.json":4,"./utils/util.js":5}],2:[function(require,module,exports){
var User = require('./CUser.js');
var util = require('./util.js');

var CManager = function(gameConfig){
	this.gameConfig = gameConfig;

	//user correspond client
	this.user = null;
	//all users
	this.users = [];
};

CManager.prototype = {
	setUser : function(userData){
		if(!this.checkUserAtUsers(userData)){
			var tempUser = new User(userData, this.gameConfig);
			this.users[userData.objectID] = tempUser;
			this.users[userData.objectID].changeState(userData.currentState);
		}else{
			console.log('user.objectID duplicated. something is wrong.');
		}
	},
	setUsers : function(userDatas){
		for(var index in userDatas){
			var tempUser = new User(userDatas[index], this.gameConfig);
			this.users[userDatas[index].objectID] = tempUser;
			this.users[userDatas[index].objectID].changeState(userDatas[index].currentState);
		}
	},
	updateUsers : function(){

	},
	checkUserAtUsers : function(userData){
		if(userData.objectID in this.users){
			return true;
		}else{
			return false;
		}
	},
	//will be merge to updateUser function
	moveUser : function(userData){
		if(this.checkUserAtUsers(userData)){
			this.users[userData.objectID].position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
			this.users[userData.objectID].targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);

			// this.users[userData.objectID].speed.x = userData.speed.x;
			// this.users[userData.objectID].speed.y = userData.speed.y;

			this.users[userData.objectID].direction = userData.direction;
			this.users[userData.objectID].rotateSpeed = userData.rotateSpeed;
			// this.users[userData.objectID].targetDirection = userData.targetDirection;

			this.users[userData.objectID].setCenter();
			this.users[userData.objectID].setTargetDirection();
			this.users[userData.objectID].setSpeed();

			if(this.user.objectID == userData.objectID){
				//offset targetPosition change >> targetPosition == position
				this.users[userData.objectID].changeState(this.gameConfig.OBJECT_STATE_MOVE_OFFSET);
			}else{
				this.users[userData.objectID].changeState(userData.currentState);
			}
		}else{
  		console.log('can`t find user data');
		}
	},
	//execute every frame this client user move
	moveUsersOffset : function(){
		for(var index in this.users){
			if(this.checkUserAtUsers(this.users[index])){
				if(this.users[index] !== this.user){
					this.users[index].position.x -= this.user.speed.x;
					this.users[index].position.y -= this.user.speed.y;

					this.users[index].targetPosition.x -= this.user.speed.x;
					this.users[index].targetPosition.y -= this.user.speed.y;
				}
			}else{
				console.log('can`t find user data');
			}
		}
	},
	// set this client user
	synchronizeUser : function(userID){
		for(var index in this.users){
			if(this.users[index].objectID === userID){
				this.user = this.users[index];
				this.user.onMoveOffset = this.moveUsersOffset.bind(this);
			}
		}
		if(this.user === null){
			console.log('if print me. Something is wrong');
		}
	}
};

module.exports = CManager;

},{"./CUser.js":3,"./util.js":5}],3:[function(require,module,exports){
var util = require('./util.js');

var User = function(userData, gameConfig){
  this.gameConfig = gameConfig;

  this.objectID = userData.objectID;

  this.currentState = null;
  this.size = userData.size;

  this.position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
  this.targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;

  this.maxSpeed = userData.maxSpeed;

  this.center = {x : 0, y : 0};
  this.speed = {x : 0, y : 0};
  this.targetDirection = 0;

  this.setCenter();
  this.setSpeed();
  this.setTargetDirection();

  this.updateInterval = false;
  this.updateFunction = null;

  this.onMoveOffset = null;
};

User.prototype = {
  changeState : function(newState){

    this.currentState = newState;

    this.stop();
    switch (this.currentState) {
      case this.gameConfig.OBJECT_STATE_IDLE:
        this.updateFunction = null;
        break;
      case this.gameConfig.OBJECT_STATE_MOVE:
        this.updateFunction = this.rotate.bind(this);
        break;
      case this.gameConfig.OBJECT_STATE_MOVE_OFFSET:
        this.updateFunction = this.rotate.bind(this);
        break;
    }
    this.update();
  },
  update : function(){
    var INTERVAL_TIMER = 1000/this.gameConfig.fps;
    this.updateInterval = setInterval(this.updateFunction, INTERVAL_TIMER);
  },
  setCenter : function(){
    this.center.x = this.position.x + this.size.width/2,
    this.center.y = this.position.y + this.size.height/2
  },
  rotate : function(){
    util.rotate.call(this);
  },
  move : function(){
    util.move.call(this);
  },
  setTargetDirection : function(){
    util.setTargetDirection.call(this);
  },
  setSpeed : function(){
    util.setSpeed.call(this);
  },
  moveOffset : function(){
    var distX = this.targetPosition.x - this.center.x;
    var distY = this.targetPosition.y - this.center.y;

    if(distX == 0 && distY == 0){
      this.stop();
      this.changeState(this.gameConfig.OBJECT_STATE_IDLE);
    }
    if(Math.abs(distX) < Math.abs(this.speed.x)){
      this.speed.x = distX;
    }
    if(Math.abs(distY) < Math.abs(this.speed.y)){
      this.speed.y = distY;
    }
    this.targetPosition.x -= this.speed.x;
    this.targetPosition.y -= this.speed.y;

    this.gameConfig.userOffset.x += this.speed.x;
    this.gameConfig.userOffset.y += this.speed.y;

    this.onMoveOffset();
  },
  stop : function(){
    console.log('stop');
    if(this.updateInterval){
      clearInterval(this.updateInterval);
      this.updateInterval = false;
    }
  }
};

module.exports = User;

},{"./util.js":5}],4:[function(require,module,exports){
module.exports={
  "fps" : 20,

  "OBJECT_STATE_IDLE" : 0,
  "OBJECT_STATE_MOVE" : 1,


  "OBJECT_STATE_MOVE_OFFSET" : 99
}

},{}],5:[function(require,module,exports){
var gameConfig = require('./gameConfig.json');

//must use with bind or call method
exports.rotate = function(){
  // console.log(this);
  if(this.targetDirection === this.direction){
    if(this.currentState === gameConfig.OBJECT_STATE_MOVE){
      this.move();
    }else if(this.currentState === gameConfig.OBJECT_STATE_MOVE_OFFSET){
        //only use at client
        this.moveOffset();
    }
  }
  //check rotate direction
  else if(this.direction > 0 && this.targetDirection < 0){
    if((180 - this.direction + 180 + this.targetDirection) < (this.direction - this.targetDirection)){
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
  }else if(this.direction < 0 && this.targetDirection >0 ){
    if((180 + this.direction + 180 - this.targetDirection) < (this.targetDirection - this.direction)){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction -= Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction -= this.rotateSpeed;
      }
    }else if(this.targetDirection > this.direction){
      if(Math.abs(this.targetDirection - this.direction)<this.rotateSpeed){
        this.direction += Math.abs(this.targetDirection - this.direction);
      }else{
        this.direction += this.rotateSpeed;
      }
    }
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

  if(this.direction >= 180){
    this.direction -= 360;
  }else if(this.direction <= -180){
    this.direction += 360;
  }
};

//must use with bind or call method
exports.move = function(){
  //calculate dist with target
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  if(distX == 0 && distY == 0){
    this.stop();
    this.changeState(gameConfig.OBJECT_STATE_IDLE);
  }
  if(Math.abs(distX) < Math.abs(this.speed.x)){
    this.speed.x = distX;
  }
  if(Math.abs(distY) < Math.abs(this.speed.y)){
    this.speed.y = distY;
  }
  this.position.x += this.speed.x;
  this.position.y += this.speed.y;

  this.center.x += this.speed.x;
  this.center.y += this.speed.y;
};

//must use with bind or call method
//setup when click canvas for move
exports.setSpeed = function(){
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

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

//must use with bind or call method
// setup when click canvas for move or fire skill
exports.setTargetDirection = function(){
  var distX = this.targetPosition.x - this.center.x;
  var distY = this.targetPosition.y - this.center.y;

  var tangentDegree = Math.atan(distY/distX) * 180 / Math.PI;
  if(distX < 0 && distY >= 0){
    this.targetDirection = tangentDegree + 180;
  }else if(distX < 0 && distY < 0){
    this.targetDirection = tangentDegree - 180;
  }else{
    this.targetDirection = tangentDegree;
  }
};

//coordinate transform
exports.localToWorldPosition = function(position, offset){
  position.x += offset.x;
  position.y += offset.y;
  return position;
};

exports.worldToLocalPosition = function(position, offset){
  position.x -= offset.x;
  position.y -= offset.y;
  return position;
};

exports.calculateOffset = function(position, canvasSize){
  position.x -= canvasSize.width/2;
  position.y -= canvasSize.height/2;
  return position;
};

},{"./gameConfig.json":4}]},{},[1]);
