var util = require('./util.js');
var gameConfig = require('./gameConfig');

var INTERVAL_TIMER = 1000/gameConfig.fps;

var User = function(userData, offset){
  this.objectID = userData.objectID;
  this.currentState = null;
  this.position = util.worldToLocalPosition(userData.position, offset);
  this.targetPosition = util.worldToLocalPosition(userData.targetPosition, offset);
  this.speed = userData.speed;
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;
  this.targetDirection = userData.targetDirection;

  this.offset = offset;

  this.updateInterval = false;
  this.updateFunction = null;

  this.rotateCount = 0;
};

User.prototype = {
  changeState : function(newState){
    console.log('inChangeState');
    console.log(this);

    this.currentState = newState;

    this.stop();
    switch (this.currentState) {
      case gameConfig.OBJECT_STATE_IDLE:
        this.updateFunction = null;
        break;
      case gameConfig.OBJECT_STATE_MOVE:
        this.updateFunction = this.rotate;
        break;
      case gameConfig.OBJECT_STATE_MOVE_OFFSET:
        this.updateFunction = this.rotate;
        break;
    }
    this.update();
  },
  update : function(){
    this.updateInterval = setInterval(this.updateFunction.bind(this), INTERVAL_TIMER);
  },
  rotate : function(){
    console.log(this.rotateCount++);
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
      this.changeState(gameConfig.OBJECT_STATE_IDLE);
    }
    if(Math.abs(distX) < Math.abs(this.speed.x)){
      this.speed.x = distX;
    }
    if(Math.abs(distY) < Math.abs(this.speed.y)){
      this.speed.y = distY;
    }
    this.targetPosition.x -= this.speed.x;
    this.targetPosition.y -= this.speed.y;

    this.offset.x += this.speed.x;
    this.offset.y += this.speed.y;
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
