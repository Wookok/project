var GameObject = require('./GameObject.js');
var util = require('../public/js/utils/util.js');

var gameConfig = require('../gameConfig.json');

var INTERVAL_TIMER = 1000/gameConfig.fps;

function LivingEntity(){
  GameObject.call(this);
  this.objectID = null;

  this.currentState = null;

  this.speed = {x: 0, y:0};
  this.direction = 0;
  this.rotateSpeed = 0;

  this.maxSpeed = 0;
  this.targetPosition = {
    x : this.position.x, y : this.position.y
  };
  this.targetDirection = 0;

  this.moveInterval = false;
  this.rotateInterval = false;
};
LivingEntity.prototype = Object.create(GameObject.prototype);
LivingEntity.prototype.constructor = LivingEntity;

//state changer
LivingEntity.prototype.changeState = function(newState){
  this.currentState = newState;
}

//rotate before move or fire skill etc..
LivingEntity.prototype.rotate = function(){
  if(this.rotateInterval){
    clearInterval(this.rotateInterval);
    this.rotateInterval = false;
  }
  this.rotateInterval = setInterval(util.rotate.bind(this), INTERVAL_TIMER);
};

//move after rotate
LivingEntity.prototype.move = function(){
  if(this.moveInterval){
    clearInterval(this.moveInterval);
    this.moveInterval = false;
  }
  console.log('move' + this.speed.x + ' : ' + this.speed.y);
  this.moveInterval = setInterval(util.move.bind(this), INTERVAL_TIMER);
};

//interval clear
LivingEntity.prototype.stop = function(){
  if(this.moveInterval){
    clearInterval(this.moveInterval);
    this.moveInterval = false;
  }
  if(this.rotateInterval){
    clearInterval(this.rotateInterval);
    this.rotateInterval = false;
  }
};

// setup when click canvas for move
LivingEntity.prototype.setTargetPosition = function(newPosition){
  this.targetPosition.x = newPosition.x;
  this.targetPosition.y = newPosition.y;
};
LivingEntity.prototype.setSpeed = function(){
  util.setSpeed.bind(this)();
};
// setup when click canvas for move or fire skill
LivingEntity.prototype.setTargetDirection = function(newPosition){
  var distX = this.targetPosition.x - this.position.x;
  var distY = this.targetPosition.y - this.position.y;

  var tangentDegree = Math.atan(distY/distX) * 180 / Math.PI;
  if(distX >= 0 && distY >=0){
    this.targetDirection =tangentDegree;
  }else if(distX < 0 && distY >=0){
    this.targetDirection = tangentDegree + 180;
  }else if(distX < 0 && distY < 0){
    this.targetDirection = tangentDegree - 180;
  }else{
    this.targetDirection = tangentDegree;
  }
  console.log(this.targetDirection);
};

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
