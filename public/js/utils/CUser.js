var util = require('./util.js');

var User = function(userData, gameConfig){
  this.gameConfig = gameConfig;

<<<<<<< HEAD
  this.objectID = userData.objectID;
  this.currentState = null;

  this.position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
  this.targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);
=======
var User = function(userData, offset){
  this.objectID = userData.objectID;
  this.currentState = null;
  this.position = util.worldToLocalPosition(userData.position, offset);
  this.targetPosition = util.worldToLocalPosition(userData.targetPosition, offset);
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
  this.speed = userData.speed;
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;
  this.targetDirection = userData.targetDirection;

<<<<<<< HEAD
  this.size = userData.size;
=======
  this.offset = offset;
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b

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
<<<<<<< HEAD
      case this.gameConfig.OBJECT_STATE_MOVE:
        this.updateFunction = this.rotate.bind(this);
        break;
      case this.gameConfig.OBJECT_STATE_MOVE_OFFSET:
        this.updateFunction = this.rotate.bind(this);
=======
      case gameConfig.OBJECT_STATE_MOVE:
        this.updateFunction = this.rotate;
        break;
      case gameConfig.OBJECT_STATE_MOVE_OFFSET:
        this.updateFunction = this.rotate;
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
        break;
    }
    this.update();
  },
  update : function(){
<<<<<<< HEAD
    var INTERVAL_TIMER = 1000/this.gameConfig.fps;
    this.updateInterval = setInterval(this.updateFunction, INTERVAL_TIMER);
=======
    this.updateInterval = setInterval(this.updateFunction.bind(this), INTERVAL_TIMER);
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
  },
  rotate : function(){
    util.rotate.call(this);
  },
  move : function(){
    util.move.call(this);
  },
  moveOffset : function(){
    var distX = this.targetPosition.x - this.position.x;
    var distY = this.targetPosition.y - this.position.y;

    if(distX == 0 && distY == 0){
      this.stop();
<<<<<<< HEAD
      this.changeState(this.gameConfig.OBJECT_STATE_IDLE);
=======
      this.changeState(gameConfig.OBJECT_STATE_IDLE);
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
    }
    if(Math.abs(distX) < Math.abs(this.speed.x)){
      this.speed.x = distX;
    }
    if(Math.abs(distY) < Math.abs(this.speed.y)){
      this.speed.y = distY;
    }
    this.targetPosition.x -= this.speed.x;
    this.targetPosition.y -= this.speed.y;

<<<<<<< HEAD
    this.gameConfig.userOffset.x += this.speed.x;
    this.gameConfig.userOffset.y += this.speed.y;

    this.onMoveOffset();
=======
    this.offset.x += this.speed.x;
    this.offset.y += this.speed.y;
>>>>>>> 3304659e2266a91f30aaf3161c185bedfa22d38b
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
