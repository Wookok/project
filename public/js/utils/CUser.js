var util = require('./util.js');

var User = function(userData, gameConfig){
  this.gameConfig = gameConfig;

  this.objectID = userData.objectID;
  this.currentState = null;

  this.position = util.worldToLocalPosition(userData.position, this.gameConfig.userOffset);
  this.targetPosition = util.worldToLocalPosition(userData.targetPosition, this.gameConfig.userOffset);
  this.speed = userData.speed;
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;
  this.targetDirection = userData.targetDirection;

  this.size = userData.size;

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
