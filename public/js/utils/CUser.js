var util = require('./util.js');
var gameConfig = require('./gameConfig');

var INTERVAL_TIMER = 1000/gameConfig.fps;

var User = function(userData){
  this.objectID = userData.objectID;
  this.currentState = null;
  this.position = userData.position;
  this.targetPosition = userData.targetPosition;
  this.speed = userData.speed;
  this.direction = userData.direction;
  this.rotateSpeed = userData.rotateSpeed;
  this.targetDirection = userData.targetDirection;

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
        this.updateFunction = this.rotate.bind(this);
        break;
    }
    this.update();
  },
  update : function(){
    this.updateInterval = setInterval(this.updateFunction, INTERVAL_TIMER);
  },
  rotate : function(){
    this.rotateCount++;
    util.rotate.call(this);
  },
  move : function(){
    util.move.call(this);
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
