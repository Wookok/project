var GameObject = require('./GameObject.js');
var util = require('../public/js/util.js');

var gameConfig = require('../gameConfig.json');

var INTERVAL_TIMER = 1000/gameConfig;

function LivingEntity(){
  GameObject.call(this);
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

//rotate before move or fire skill etc..
LivingEntity.prototype.rotate = function(){
  if(this.rotateInterval){
    clearInterval(this.rotateInterval);
    this.rotateInterval = false;
  }
  this.rotateInterval = setInterval(util.rotate.bind(this), 1000);
};

//move after rotate
LivingEntity.prototype.move = function(){
  if(this.moveInterval){
    clearInterval(this.moveInterval);
    this.moveInterval = false;
  }
  console.log('move' + this.speed.x + ' : ' + this.speed.y);
  this.moveInterval = setInterval(util.move.bind(this), 1000);
};

//interval variable initialize
LivingEntity.prototype.stop = function(){
  if(this.moveInterval){
    clearInterval(this.moveInterval);
    this.moveInterval = false;
  };
  if(this.rotateInterval){
    clearInterval(this.rotateInterval);
    this.rotateInterval = false;
  };
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
  var distX = this.targetPosition.x - this.localPosition.x;
  var distY = this.targetPosition.y - this.localPosition.y;

  if(distX >= 0 && distY >=0){
    this.targetDirection = Math.atan(distY/distX);
  }else if(distX < 0 && distY >=0){
    this.targetDirection = Math.atan(distY/distX) + Math.PI/2;
  }else if(distX < 0 && distY < 0){
    this.targetDirection = -Math.atan(distY/distX) - Math.PI/2;
  }else{
    this.targetDirection = Math.atan(distY/distX);
  }
};

// initialize method
LivingEntity.prototype.setRotateSpeed = function(x){
  this.rotateSpeed = x * Math.PI/180;
};
LivingEntity.prototype.setMaxSpeed = function(x){
  this.maxSpeed = x;
};

module.exports = LivingEntity;
