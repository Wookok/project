var GameObject = require('./GameObject.js');
var util = require('../public/js/utils/util.js');

var gameConfig = require('../public/js/utils/gameConfig.json');

var INTERVAL_TIMER = 1000/gameConfig.fps;

function LivingEntity(){
  GameObject.call(this);
  this.objectID = null;

  this.currentState = gameConfig.OBJECT_STATE_IDLE;

  this.speed = {x: 0, y:0};
  this.direction = 0;
  this.rotateSpeed = 0;

  this.maxSpeed = 0;
  this.targetPosition = {
    x : this.position.x, y : this.position.y
  };
  this.targetDirection = 0;

  this.updateInterval = false;
  this.updateFunction = null;
};
LivingEntity.prototype = Object.create(GameObject.prototype);
LivingEntity.prototype.constructor = LivingEntity;

//state changer. change update listener
LivingEntity.prototype.changeState = function(newState){
  this.currentState = newState;

  this.stop();
  switch(this.currentState){
    case gameConfig.OBJECT_STATE_IDLE :
      this.updateFunction = this.idle;
      break;
    case gameConfig.OBJECT_STATE_MOVE :
      this.updateFunction = this.rotate.bind(this);
      break;
    }
  this.update();
};
LivingEntity.prototype.update = function(){
  this.updateInterval = setInterval(this.updateFunction, INTERVAL_TIMER);
};

//rotate before move or fire skill etc..
LivingEntity.prototype.rotate = function(){
  util.rotate.call(this);
};
//move after rotate
LivingEntity.prototype.move = function(){
  util.move.call(this);
};
LivingEntity.prototype.idle = function(){
  //do nothing or send packet;
};
//interval clear
LivingEntity.prototype.stop = function(){
  if(this.updateInterval){
    clearInterval(this.updateInterval);
    this.updateInterval = false;
  }
};

// setup when click canvas for move
LivingEntity.prototype.setTargetPosition = function(newPosition){
  this.targetPosition.x = newPosition.x;
  this.targetPosition.y = newPosition.y;
};
LivingEntity.prototype.setSpeed = function(){
  util.setSpeed.call(this);
};
LivingEntity.prototype.setTargetDirection = function(){
  util.setTargetDirection.call(this);
};
// setup when click canvas for move or fire skill
// LivingEntity.prototype.setTargetDirection = function(newPosition){
//   var distX = this.targetPosition.x - this.center.x;
//   var distY = this.targetPosition.y - this.center.y;
//
//   var tangentDegree = Math.atan(distY/distX) * 180 / Math.PI;
//   if(distX >= 0 && distY >=0){
//     this.targetDirection = tangentDegree;
//   }else if(distX < 0 && distY >=0){
//     this.targetDirection = tangentDegree + 180;
//   }else if(distX < 0 && distY < 0){
//     this.targetDirection = tangentDegree - 180;
//   }else{
//     this.targetDirection = tangentDegree;
//   }
// };

// initialize method
LivingEntity.prototype.setRotateSpeed = function(x){
  this.rotateSpeed = x;
};
LivingEntity.prototype.setMaxSpeed = function(x){
  this.maxSpeed = x;
};
LivingEntity.prototype.assignID = function(x){
  this.objectID = x;
};
// LivingEntity.prototype.assignID = function(x){
//   this.objectID = x + util.assignRandomID();
// };

module.exports = LivingEntity;
