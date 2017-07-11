var util = require('../public/util.js');

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

  this.onMoveOffset = new Function();

  this.entityTreeEle = {
    x : this.position.x,
    y : this.position.y,
    width : this.size.width,
    height : this.size.height,
    id : this.objectID
  };

  this.onMove = new Function();
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
    var INTERVAL_TIMER = 1000/this.gameConfig.INTERVAL;
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
    util.moveOffset.call(this);
    // var distX = this.targetPosition.x - this.center.x;
    // var distY = this.targetPosition.y - this.center.y;
    //
    // if(distX == 0 && distY == 0){
    //   this.stop();
    //   this.changeState(this.gameConfig.OBJECT_STATE_IDLE);
    // }
    // if(Math.abs(distX) < Math.abs(this.speed.x)){
    //   this.speed.x = distX;
    // }
    // if(Math.abs(distY) < Math.abs(this.speed.y)){
    //   this.speed.y = distY;
    // }
    // var addPos = this.onMove(this);
    // if(addPos !== undefined){
    //   this.targetPosition.x -= addPos.x;
    //   this.targetPosition.y -= addPos.y;
    //
    //   this.gameConfig.userOffset.x += addPos.x;
    //   this.gameConfig.userOffset.y += addPos.y;
    // }
    // this.targetPosition.x -= this.speed.x;
    // this.targetPosition.y -= this.speed.y;
    //
    // this.gameConfig.userOffset.x += this.speed.x;
    // this.gameConfig.userOffset.y += this.speed.y;
    //
    // this.onMoveOffset(addPos);
  },
  addPosAndTargetPos : function(addPosX , addPosY){
    this.position.x += addPosX;
    this.position.y += addPosY;

    this.targetPosition.x += addPosX;
    this.targetPosition.y += addPosY;

    this.setCenter();
  },
  stop : function(){
    console.log('stop');
    if(this.updateInterval){
      clearInterval(this.updateInterval);
      this.updateInterval = false;
    }
  },
  setUserEle : function(){
    this.entityTreeEle = {
      x : this.position.x,
      y : this.position.y,
      width : this.size.width,
      height : this.size.height,
      id : this.objectID
    };
  }
};

module.exports = User;
